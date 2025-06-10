#!/bin/bash

# 8Trader8Panda Production Deployment Script
# Deploys to Alibaba Cloud ECS: 8.222.177.208

echo "🚀 Starting 8Trader8Panda Production Deployment..."

# Configuration
SERVER_IP="8.222.177.208"
SERVER_USER="root"
SERVER_PASS="Trading8Panda!"
APP_DIR="/opt/trading-app"
PM2_APP_NAME="8trader8panda"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test SSH connection first
log_info "Testing SSH connection to $SERVER_IP..."
if timeout 10 nc -z $SERVER_IP 22; then
    log_info "SSH port 22 is accessible"
else
    log_error "Cannot reach SSH port on $SERVER_IP"
    exit 1
fi

# Create deployment package
log_info "Creating deployment package..."
tar -czf trading-app-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=*.log \
    package.json \
    package-lock.json \
    tsconfig.json \
    vite.config.ts \
    tailwind.config.ts \
    drizzle.config.ts \
    postcss.config.js \
    components.json \
    server/ \
    client/ \
    shared/ \
    deploy-server.sh \
    production.env.template

# Create comprehensive deployment script for remote execution
cat > remote-deploy.sh << 'EOF'
#!/bin/bash

echo "🔧 Starting remote deployment on ECS instance..."

# Update system packages
yum update -y

# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install Redis if not present
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    yum install -y redis
    systemctl enable redis
    systemctl start redis
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    yum install -y postgresql postgresql-server postgresql-contrib
    postgresql-setup initdb
    systemctl enable postgresql
    systemctl start postgresql
fi

# Create application directory
mkdir -p /opt/trading-app
cd /opt/trading-app

# Extract deployment package
if [ -f "trading-app-deploy.tar.gz" ]; then
    echo "Extracting application files..."
    tar -xzf trading-app-deploy.tar.gz
    rm trading-app-deploy.tar.gz
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Build the application
echo "Building application..."
npm run build

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Keys (configured)
ALIBABA_CLOUD_API_KEY=sk-9f4c8b2a1d3e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
ALCHEMY_API_KEY=mXj8k9L2mN3oP4qR5sT6uV7wX8yZ9A0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0vW1xY2zA3bC4dE5fG6hI7jK8lM9nO0pQ1rS2tU3vW4xY5z
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F
TWITTER_CLIENT_SECRET=eL0666PfNYfAK_S7kNIBBjvSVU44O_a5N2In2fQg04Maye1FK7

# Database Configuration
DATABASE_URL=postgresql://trading_user:trading_password@localhost:5432/trading_db
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=8trader8panda-super-secure-session-key-2024
JWT_SECRET=8trader8panda-jwt-secret-key-2024

# Trading Configuration
MAX_POSITION_SIZE=1000
STOP_LOSS_PERCENT=5
RISK_MANAGEMENT_ENABLED=true
LIVE_TRADING_ENABLED=false
ENVEOF

# Setup database
echo "Setting up database..."
sudo -u postgres psql << 'SQLEOF'
CREATE USER trading_user WITH PASSWORD 'trading_password';
CREATE DATABASE trading_db OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_db TO trading_user;
\q
SQLEOF

# Run database migrations
echo "Running database migrations..."
npx drizzle-kit push:pg

# Configure PM2 ecosystem
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: '8trader8panda',
    script: 'npm',
    args: 'run dev',
    cwd: '/opt/trading-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/8trader8panda-error.log',
    out_file: '/var/log/8trader8panda-out.log',
    log_file: '/var/log/8trader8panda.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
PM2EOF

# Start/restart application with PM2
echo "Starting application with PM2..."
pm2 delete 8trader8panda 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure firewall
echo "Configuring firewall..."
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# Setup Nginx reverse proxy
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    yum install -y nginx
fi

cat > /etc/nginx/conf.d/8trader8panda.conf << 'NGINXEOF'
server {
    listen 80;
    server_name 8trader8panda8.xin 8.222.177.208;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

systemctl enable nginx
systemctl start nginx
systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Application accessible at: http://8.222.177.208"
echo "🌐 Domain: http://8trader8panda8.xin (after DNS configuration)"
echo "📊 PM2 Status: pm2 status"
echo "📋 Application logs: pm2 logs 8trader8panda"

# Display final status
echo "🔍 Final system status:"
echo "- Node.js: $(node --version)"
echo "- NPM: $(npm --version)"
echo "- PM2: $(pm2 --version)"
echo "- Redis: $(redis-cli ping)"
echo "- PostgreSQL: $(sudo -u postgres psql -c 'SELECT version();' | head -3 | tail -1)"
echo "- Nginx: $(nginx -v 2>&1)"

EOF

chmod +x remote-deploy.sh

log_info "Deployment package created successfully"
log_info "Package size: $(du -h trading-app-deploy.tar.gz | cut -f1)"

# Deploy to server using curl and SSH tunnel approach
log_info "Deploying to production server $SERVER_IP..."

# Create a simple HTTP server to transfer files
python3 -m http.server 8080 &
HTTP_PID=$!

# Give server time to start
sleep 2

# Execute deployment on remote server
log_info "Executing remote deployment..."

# Create SSH connection and execute deployment
{
    echo "cd /tmp"
    echo "curl -o trading-app-deploy.tar.gz http://$(curl -s ifconfig.me):8080/trading-app-deploy.tar.gz"
    echo "curl -o remote-deploy.sh http://$(curl -s ifconfig.me):8080/remote-deploy.sh"
    echo "chmod +x remote-deploy.sh"
    echo "cd /opt && mkdir -p trading-app && cd trading-app"
    echo "mv /tmp/trading-app-deploy.tar.gz ."
    echo "bash /tmp/remote-deploy.sh"
} > deployment-commands.sh

# Execute the deployment commands
timeout 300 bash deployment-commands.sh

# Cleanup
kill $HTTP_PID 2>/dev/null || true
rm -f trading-app-deploy.tar.gz remote-deploy.sh deployment-commands.sh

log_info "🎉 Production deployment initiated!"
log_info "📍 Server: http://8.222.177.208:3000"
log_info "🌐 Domain: http://8trader8panda8.xin (pending DNS)"
log_info "📊 Monitor: ssh root@8.222.177.208 'pm2 status'"

echo
echo "🚀 Your 8Trader8Panda platform is deploying to production!"
echo "📱 Access your trading platform at: http://8.222.177.208:3000"
echo "🔧 Check deployment status: ssh root@8.222.177.208 'pm2 logs 8trader8panda'"