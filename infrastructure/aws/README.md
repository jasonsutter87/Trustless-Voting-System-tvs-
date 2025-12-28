# TVS AWS Infrastructure

Terraform configuration for deploying TVS (Trustless Voting System) central cloud infrastructure on AWS.

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │                  CloudFront                  │
                    │            (Voter App + API Cache)           │
                    └────────────────────┬────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────────┐
                    │                    │                         │
                    ▼                    ▼                         │
            ┌───────────────┐    ┌───────────────┐                │
            │  S3 Bucket    │    │  Application  │                │
            │ (Voter App)   │    │ Load Balancer │                │
            └───────────────┘    └───────┬───────┘                │
                                         │                         │
                    ┌────────────────────┼────────────────────────┤
                    │                    │                         │
                    ▼                    ▼                         ▼
            ┌───────────────┐    ┌───────────────┐         ┌───────────────┐
            │  ECS Fargate  │    │  ECS Fargate  │   ...   │  ECS Fargate  │
            │  (TVS API)    │    │  (TVS API)    │         │  (TVS API)    │
            └───────┬───────┘    └───────┬───────┘         └───────┬───────┘
                    │                    │                         │
                    └────────────────────┼─────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────────┐
                    │                    │                         │
                    ▼                    ▼                         ▼
            ┌───────────────┐    ┌───────────────┐         ┌───────────────┐
            │  RDS PostgreSQL│    │  S3 VeilCloud │         │Secrets Manager│
            │  (Multi-AZ)   │    │  (Vote Data)  │         │  (Credentials) │
            └───────────────┘    └───────────────┘         └───────────────┘
```

## Resources Created

| Resource | Description |
|----------|-------------|
| VPC | 3 AZ VPC with public/private subnets |
| ECS Cluster | Fargate cluster for TVS API |
| RDS PostgreSQL | Multi-AZ PostgreSQL 16 instance |
| S3 (VeilCloud) | Encrypted bucket for vote storage |
| S3 (Voter App) | Static hosting for voter app |
| CloudFront | CDN for voter app and API |
| ALB | Application Load Balancer for API |
| ECR | Container registry for TVS API image |
| Secrets Manager | Database URL and master key |
| CloudWatch | Log groups and metrics |

## Prerequisites

1. [Terraform](https://terraform.io) >= 1.0
2. AWS CLI configured with appropriate credentials
3. Domain name with Route 53 (optional, for custom domain)

## Quick Start

```bash
# Initialize Terraform
terraform init

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Preview changes
terraform plan

# Deploy infrastructure
terraform apply
```

## Deployment Steps

### 1. Set Up Variables

Create `terraform.tfvars`:

```hcl
region      = "us-east-1"
environment = "prod"
db_password = "your-secure-password"
master_key  = "your-32-byte-hex-key"  # openssl rand -hex 32
domain_name = "tvs.gov"
api_desired_count = 3
```

### 2. Deploy Infrastructure

```bash
terraform apply
```

### 3. Build and Push Docker Image

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t tvs-api .
docker tag tvs-api:latest <ecr-repo-url>:latest
docker push <ecr-repo-url>:latest

# Force ECS to update
aws ecs update-service --cluster tvs-cluster-prod --service tvs-api-prod --force-new-deployment
```

### 4. Deploy Voter App

```bash
# Build voter app
cd apps/voter
NEXT_PUBLIC_DEPLOYMENT_MODE=cloud \
NEXT_PUBLIC_CLOUD_API_URL=https://api.tvs.gov \
npm run build

# Sync to S3
aws s3 sync out/ s3://tvs-voter-app-prod-<account-id>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

## Environment-Specific Configuration

### Development
- Single NAT gateway
- Smaller RDS instance (db.t3.medium)
- Deletion protection disabled
- 7-day log retention

### Production
- NAT gateway per AZ
- Large RDS instance (db.r6g.xlarge)
- Deletion protection enabled
- 365-day log retention
- Multi-AZ RDS

## Scaling

### API Scaling

The ECS service is configured for auto-scaling. Adjust in the console or add:

```hcl
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### Database Scaling

For higher throughput:
1. Increase `instance_class` to `db.r6g.2xlarge` or higher
2. Enable read replicas for read-heavy workloads
3. Consider Aurora PostgreSQL for extreme scale

## Security

- All S3 buckets have versioning and encryption enabled
- RDS uses encrypted storage
- Secrets stored in AWS Secrets Manager
- Security groups restrict access to minimum required
- CloudFront enforces HTTPS
- US-only geo-restriction on CloudFront

## Monitoring

View logs in CloudWatch:

```bash
# API logs
aws logs tail /ecs/tvs-api-prod --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=tvs-api-prod Name=ClusterName,Value=tvs-cluster-prod \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

## Cost Estimates

| Environment | Monthly Cost (est.) |
|-------------|---------------------|
| Development | ~$200-300 |
| Production | ~$1,500-2,500 |

Main cost drivers:
- RDS Multi-AZ (largest component)
- NAT Gateway data transfer
- ECS Fargate compute

## Cleanup

```bash
# Destroy all resources (careful in production!)
terraform destroy
```

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check task status
aws ecs describe-tasks --cluster tvs-cluster-prod --tasks <task-id>

# View stopped task reasons
aws ecs describe-services --cluster tvs-cluster-prod --services tvs-api-prod
```

### Database Connection Issues

1. Verify security group allows ECS tasks
2. Check Secrets Manager has correct credentials
3. Verify RDS is in the correct VPC subnets

### CloudFront 403 Errors

1. Check S3 bucket policy allows CloudFront OAC
2. Verify origin access control is configured
3. Check for trailing slashes in paths
