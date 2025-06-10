terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.230"
    }
  }
}

# Configure the Alibaba Cloud Provider
provider "alicloud" {
  region = var.region
}

# Variables
variable "region" {
  description = "Alibaba Cloud region"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "8trader8panda"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Data sources
data "alicloud_zones" "default" {
  available_resource_creation = ["VSwitch"]
}

data "alicloud_instance_types" "default" {
  availability_zone = data.alicloud_zones.default.zones[0].id
  cpu_core_count    = 2
  memory_size      = 4
}

data "alicloud_images" "default" {
  name_regex  = "^ubuntu_24_04_x64*"
  most_recent = true
  owners      = "system"
}

# VPC and Network
resource "alicloud_vpc" "main" {
  vpc_name   = "${var.project_name}-vpc"
  cidr_block = "10.0.0.0/8"
  
  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_vswitch" "main" {
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = "10.0.1.0/24"
  zone_id      = data.alicloud_zones.default.zones[0].id
  vswitch_name = "${var.project_name}-vswitch"
  
  tags = {
    Name        = "${var.project_name}-vswitch"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Security Group
resource "alicloud_security_group" "main" {
  name        = "${var.project_name}-sg"
  description = "Security group for 8Trader8Panda"
  vpc_id      = alicloud_vpc.main.id
  
  tags = {
    Name        = "${var.project_name}-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_security_group_rule" "allow_ssh" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "22/22"
  priority          = 1
  security_group_id = alicloud_security_group.main.id
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "allow_http" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "80/80"
  priority          = 1
  security_group_id = alicloud_security_group.main.id
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "allow_https" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "443/443"
  priority          = 1
  security_group_id = alicloud_security_group.main.id
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "allow_app" {
  type              = "ingress"
  ip_protocol       = "tcp"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "3000/3000"
  priority          = 1
  security_group_id = alicloud_security_group.main.id
  cidr_ip           = "0.0.0.0/0"
}

# Key Pair for SSH
resource "alicloud_ecs_key_pair" "main" {
  key_pair_name = "${var.project_name}-keypair"
  
  tags = {
    Name        = "${var.project_name}-keypair"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ECS Instance
resource "alicloud_instance" "main" {
  instance_name        = "${var.project_name}-instance"
  image_id            = data.alicloud_images.default.images[0].id
  instance_type       = "ecs.t6-c1m2.large"
  security_groups     = [alicloud_security_group.main.id]
  vswitch_id          = alicloud_vswitch.main.id
  key_name            = alicloud_ecs_key_pair.main.key_pair_name
  
  system_disk_category = "cloud_essd"
  system_disk_size     = 40
  
  internet_charge_type       = "PayByTraffic"
  internet_max_bandwidth_out = 10
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
  }))
  
  tags = {
    Name        = "${var.project_name}-instance"
    Environment = var.environment
    Project     = var.project_name
  }
}

# RDS PostgreSQL Database
resource "alicloud_db_instance" "main" {
  engine               = "PostgreSQL"
  engine_version       = "14.0"
  instance_type        = "pg.n2.small.1"
  instance_storage     = 20
  instance_charge_type = "Postpaid"
  vswitch_id          = alicloud_vswitch.main.id
  security_ips        = [alicloud_vswitch.main.cidr_block]
  
  tags = {
    Name        = "${var.project_name}-db"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_db_database" "main" {
  instance_id = alicloud_db_instance.main.id
  name        = "trading_db"
  character_set = "UTF8"
}

resource "alicloud_db_account" "main" {
  db_instance_id   = alicloud_db_instance.main.id
  account_name     = "trading_user"
  account_password = "TradingPassword123!"
  account_type     = "Normal"
}

resource "alicloud_db_account_privilege" "main" {
  instance_id  = alicloud_db_instance.main.id
  account_name = alicloud_db_account.main.account_name
  privilege    = "ReadWrite"
  db_names     = [alicloud_db_database.main.name]
}

# Redis Cache
resource "alicloud_kvstore_instance" "main" {
  instance_name     = "${var.project_name}-redis"
  instance_class    = "redis.master.micro.default"
  instance_type     = "Redis"
  engine_version    = "5.0"
  payment_type      = "PostPaid"
  vswitch_id       = alicloud_vswitch.main.id
  private_ip       = "10.0.1.10"
  password         = "RedisPassword123!"
  
  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Object Storage Bucket
resource "alicloud_oss_bucket" "main" {
  bucket = "${var.project_name}-storage-${random_string.bucket_suffix.result}"
  acl    = "private"
  
  tags = {
    Name        = "${var.project_name}-storage"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Application Load Balancer
resource "alicloud_slb_load_balancer" "main" {
  load_balancer_name = "${var.project_name}-alb"
  vswitch_id        = alicloud_vswitch.main.id
  load_balancer_spec = "slb.s1.small"
  address_type      = "internet"
  
  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_slb_listener" "main" {
  load_balancer_id = alicloud_slb_load_balancer.main.id
  backend_port     = 3000
  frontend_port    = 80
  protocol         = "http"
  bandwidth        = 10
  
  health_check_type     = "http"
  health_check_uri      = "/api/health"
  health_check_timeout  = 5
  health_check_interval = 30
}

resource "alicloud_slb_backend_server" "main" {
  load_balancer_id = alicloud_slb_load_balancer.main.id
  backend_servers {
    server_id = alicloud_instance.main.id
    weight    = 100
  }
}

# Auto Scaling Group
resource "alicloud_ess_scaling_group" "main" {
  scaling_group_name = "${var.project_name}-asg"
  min_size          = 1
  max_size          = 5
  desired_capacity  = 2
  vswitch_ids      = [alicloud_vswitch.main.id]
  loadbalancer_ids = [alicloud_slb_load_balancer.main.id]
  
  tags = {
    Name        = "${var.project_name}-asg"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "alicloud_ess_scaling_configuration" "main" {
  scaling_group_id  = alicloud_ess_scaling_group.main.id
  image_id         = data.alicloud_images.default.images[0].id
  instance_type    = "ecs.t6-c1m2.large"
  security_group_id = alicloud_security_group.main.id
  key_name         = alicloud_ecs_key_pair.main.key_pair_name
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
  }))
  
  system_disk_category = "cloud_essd"
  system_disk_size     = 40
  
  internet_charge_type       = "PayByTraffic"
  internet_max_bandwidth_out = 10
}

# CloudMonitor Alerts
resource "alicloud_cms_alarm" "cpu_high" {
  name    = "${var.project_name}-cpu-high"
  project = "acs_ecs_dashboard"
  metric  = "CPUUtilization"
  dimensions = {
    instanceId = alicloud_instance.main.id
  }
  statistics      = "Average"
  period          = 300
  operator        = ">="
  threshold       = "80"
  triggered_count = 3
  contact_groups  = ["${var.project_name}-contacts"]
}

# Outputs
output "instance_public_ip" {
  description = "Public IP of the ECS instance"
  value       = alicloud_instance.main.public_ip
}

output "load_balancer_address" {
  description = "Load balancer public address"
  value       = alicloud_slb_load_balancer.main.address
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://trading_user:TradingPassword123!@${alicloud_db_instance.main.connection_string}/trading_db"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "${alicloud_kvstore_instance.main.connection_domain}:6379"
  sensitive   = true
}

output "oss_bucket_name" {
  description = "OSS bucket name"
  value       = alicloud_oss_bucket.main.bucket
}