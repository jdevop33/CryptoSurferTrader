# Alibaba Cloud Production Deployment Checklist

## Phase 1: Infrastructure Setup (Day 1-2)

### 1. Alibaba Cloud Account Setup
- [ ] Create Alibaba Cloud account
- [ ] Verify identity and payment method
- [ ] Enable required services in Singapore region

### 2. ECS Instance Configuration
```bash
# Instance Specifications
Instance Type: ecs.c6.large
vCPU: 2 cores
Memory: 4GB
Storage: 40GB SSD
OS: Ubuntu 22.04 LTS
Region: ap-southeast-1 (Singapore)
```

### 3. Security Group Setup
```bash
# Inbound Rules
HTTP (80): 0.0.0.0/0
HTTPS (443): 0.0.0.0/0
SSH (22): YOUR_IP/32

# Outbound Rules
HTTPS (443): 0.0.0.0/0
Redis (6379): Redis-Security-Group
```

### 4. RDS Redis Instance
```bash
# Redis Configuration
Instance Class: redis.master.small.default
Version: 6.0
Memory: 1GB
VPC: Same as ECS
Backup: Daily automated
```

### 5. Server Load Balancer (SLB)
```bash
# Load Balancer Setup
Type: Application Load Balancer
Listeners: HTTP (80) -> HTTPS redirect
          HTTPS (443) -> Backend Port 5000
Health Check: /api/system/health
SSL Certificate: 8trader8panda8.xin
```

## Phase 2: Domain & SSL Configuration (Day 2)

### 1. DNS Configuration
```bash
# DNS Records for 8trader8panda8.xin
A     @     [SLB_IP_ADDRESS]
A     www   [SLB_IP_ADDRESS]
CNAME api   8trader8panda8.xin
```

### 2. SSL Certificate
- [ ] Purchase SSL certificate from Alibaba Cloud
- [ ] Configure automatic renewal
- [ ] Verify HTTPS works correctly

## Phase 3: Container Registry Setup (Day 2)

### 1. Create Container Registry
```bash
# Registry Configuration
Namespace: trading
Repository: 8trader8panda
Region: cn-singapore
Registry URL: registry.cn-singapore.cr.aliyuncs.com
```

### 2. Docker Login Credentials
```bash
# Save these for CI/CD
ACR_USERNAME=your-acr-username
ACR_PASSWORD=your-acr-password
```

## Phase 4: Application Deployment (Day 3)

### 1. Environment Configuration
```bash
# Copy production.env.template to ECS
scp production.env.template root@[ECS_IP]:/etc/trading/.env

# Edit with actual values
REDIS_HOST=r-xxxxx.redis.rds.aliyuncs.com
TWITTER_BEARER_TOKEN=your-actual-token
ALIBABA_CLOUD_API_KEY=your-actual-key
```

### 2. Docker Installation on ECS
```bash
# Install Docker on Ubuntu
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
```

### 3. Initial Deployment
```bash
# Build and deploy
docker build -t registry.cn-singapore.cr.aliyuncs.com/trading/8trader8panda:latest .
docker push registry.cn-singapore.cr.aliyuncs.com/trading/8trader8panda:latest

# Run on ECS
chmod +x deploy.sh
./deploy.sh
```

## Phase 5: CI/CD Pipeline Setup (Day 3-4)

### 1. GitHub Repository Setup
```bash
# Required GitHub Secrets
ACR_USERNAME=your-acr-username
ACR_PASSWORD=your-acr-password
ECS_HOST=your-ecs-ip
ECS_USERNAME=root
ECS_SSH_KEY=your-private-key
SLACK_WEBHOOK=your-slack-webhook (optional)
```

### 2. SSH Key Configuration
```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t rsa -b 4096 -f github_actions_key
# Add public key to ECS ~/.ssh/authorized_keys
# Add private key to GitHub Secrets as ECS_SSH_KEY
```

### 3. GitHub Actions Workflow
- [ ] Create `.github/workflows/` directory
- [ ] Add deployment workflow file
- [ ] Test with a commit to main branch

## Phase 6: Monitoring Setup (Day 4)

### 1. CloudMonitor Configuration
```bash
# Install CloudMonitor agent on ECS
wget http://cms-download.aliyun.com/cms-go-agent/cms_go_agent_linux-amd64.tar.gz
tar -xzf cms_go_agent_linux-amd64.tar.gz
sudo ./cms_go_agent_linux-amd64/install.sh
```

### 2. Custom Metrics Setup
```bash
# Trading-specific alerts
- API response time > 2000ms
- Memory usage > 80%
- Trading signals per minute < 1
- Failed trades > 5 per hour
```

### 3. Log Management
```bash
# Configure log rotation
sudo mkdir -p /app/logs
sudo chown trading:trading /app/logs

# Logrotate configuration
/app/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 trading trading
}
```

## Phase 7: Security Hardening (Day 4-5)

### 1. WAF Configuration
```bash
# Web Application Firewall rules
- Rate limiting: 100 requests/minute per IP
- SQL injection protection
- XSS protection
- Bot detection for trading endpoints
```

### 2. Security Scanning
```bash
# Regular security checks
- Container vulnerability scanning
- Dependency security audits
- SSL certificate monitoring
- Access log analysis
```

## Phase 8: Performance Optimization (Day 5)

### 1. CDN Setup
```bash
# Alibaba Cloud CDN
Origin: 8trader8panda8.xin
Cache Rules: 
  - Static assets: 7 days
  - API responses: No cache
  - HTML pages: 1 hour
```

### 2. Database Optimization
```bash
# Redis optimization
maxmemory-policy: allkeys-lru
maxmemory: 800mb
save: 900 1 300 10 60 10000
```

## Phase 9: Backup & Disaster Recovery (Day 5)

### 1. Automated Backups
```bash
# ECS snapshot schedule
Frequency: Daily
Retention: 7 days
Time: 2:00 AM SGT

# Redis backup
Frequency: Every 6 hours
Retention: 3 days
```

### 2. Disaster Recovery Plan
```bash
# Recovery procedures
- ECS instance failure: Auto-scaling group
- Redis failure: Standby instance
- Code rollback: Previous Docker image
- Data corruption: Point-in-time recovery
```

## Phase 10: Go-Live Validation (Day 6)

### 1. Production Testing Checklist
- [ ] Twitter API connectivity
- [ ] Market data feeds working
- [ ] AI analysis generating signals
- [ ] WebSocket connections stable
- [ ] Database read/write operations
- [ ] SSL certificate valid
- [ ] DNS resolution correct
- [ ] Load balancer health checks passing

### 2. Performance Benchmarks
```bash
# Expected metrics
Response time: < 500ms (95th percentile)
Uptime: > 99.9%
Memory usage: < 70%
CPU usage: < 60%
Trading signals: 1-2 per minute
```

### 3. Monitoring Dashboard
```bash
# Key metrics to monitor
- Active trading positions
- Daily P&L
- API error rates
- System resource usage
- Twitter rate limit status
- AI analysis confidence levels
```

## Cost Optimization Tips

### Monthly Cost Breakdown
- ECS Instance: $35-45
- Redis: $25-35
- Load Balancer: $15-25
- SSL Certificate: $10-15
- CDN: $5-10
- Monitoring: $5-10
- **Total: $95-140/month**

### Cost Savings
- Use Reserved Instances for 20% discount
- Optimize Redis memory usage
- Enable auto-scaling to handle traffic spikes
- Monitor and optimize data transfer costs

## Post-Deployment Maintenance

### Weekly Tasks
- [ ] Review trading performance metrics
- [ ] Check system resource usage
- [ ] Validate backup integrity
- [ ] Update security patches

### Monthly Tasks
- [ ] Analyze cost optimization opportunities
- [ ] Review and update trading strategies
- [ ] Security audit and penetration testing
- [ ] Capacity planning review

This checklist ensures a smooth transition from development to production with enterprise-grade reliability and security for your automated trading platform.