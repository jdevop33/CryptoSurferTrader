#!/bin/bash
# Alibaba Cloud ECS Deployment Script for 8Trader8Panda

set -e

# Configuration
REGISTRY="registry.cn-singapore.cr.aliyuncs.com/trading/8trader8panda"
IMAGE_TAG="latest"
CONTAINER_NAME="trading-app"
PORT="5000"

echo "Starting deployment to Alibaba Cloud ECS..."

# Build and tag Docker image
echo "Building Docker image..."
docker build -t $REGISTRY:$IMAGE_TAG .

# Push to Alibaba Container Registry
echo "Pushing to Container Registry..."
docker push $REGISTRY:$IMAGE_TAG

# Stop existing container gracefully
if docker ps -q -f name=$CONTAINER_NAME; then
    echo "Stopping existing container..."
    docker stop $CONTAINER_NAME
    docker rename $CONTAINER_NAME ${CONTAINER_NAME}-backup-$(date +%s)
fi

# Start new container
echo "Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $PORT:$PORT \
    --env-file /etc/trading/.env \
    --log-driver json-file \
    --log-opt max-size=100m \
    --log-opt max-file=3 \
    $REGISTRY:$IMAGE_TAG

# Health check
echo "Performing health check..."
sleep 30

if curl -f http://localhost:$PORT/api/system/health; then
    echo "Deployment successful! Application is healthy."
    
    # Clean up old backup containers (keep last 3)
    docker ps -a -f name=${CONTAINER_NAME}-backup --format "table {{.Names}}" | tail -n +4 | xargs -r docker rm
    
else
    echo "Health check failed! Rolling back..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    
    # Find latest backup and restore
    BACKUP=$(docker ps -a -f name=${CONTAINER_NAME}-backup --format "{{.Names}}" | head -1)
    if [ ! -z "$BACKUP" ]; then
        docker rename $BACKUP $CONTAINER_NAME
        docker start $CONTAINER_NAME
        echo "Rollback completed."
    fi
    exit 1
fi

echo "Deployment completed successfully!"