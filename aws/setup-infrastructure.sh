#!/bin/bash
# AWS Infrastructure Setup Script
# This script sets up the necessary AWS infrastructure for the Economic Data Platform

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
AWS_REGION="us-east-1"
VPC_NAME="economic-data-vpc"
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_SUBNET_1_CIDR="10.0.3.0/24"
PRIVATE_SUBNET_2_CIDR="10.0.4.0/24"
ECS_CLUSTER_NAME="economic-data-cluster"
ECR_BACKEND_REPO="economic-data-backend"
S3_BUCKET_NAME="economic-data-platform"
CLOUDFRONT_DISTRIBUTION_NAME="economic-data-distribution"
ALB_NAME="economic-data-alb"
SECURITY_GROUP_NAME="economic-data-sg"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "=== Starting AWS infrastructure setup ==="

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block "$VPC_CIDR" \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$VPC_NAME}]" \
    --region "$AWS_REGION" \
    --query "Vpc.VpcId" \
    --output text)

echo "VPC created with ID: $VPC_ID"

# Enable DNS hostnames for the VPC
aws ec2 modify-vpc-attribute \
    --vpc-id "$VPC_ID" \
    --enable-dns-hostnames "{\"Value\":true}" \
    --region "$AWS_REGION"

# Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$VPC_NAME-igw}]" \
    --region "$AWS_REGION" \
    --query "InternetGateway.InternetGatewayId" \
    --output text)

echo "Internet Gateway created with ID: $IGW_ID"

# Attach Internet Gateway to VPC
echo "Attaching Internet Gateway to VPC..."
aws ec2 attach-internet-gateway \
    --internet-gateway-id "$IGW_ID" \
    --vpc-id "$VPC_ID" \
    --region "$AWS_REGION"

# Create public subnets
echo "Creating public subnets..."
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block "$PUBLIC_SUBNET_1_CIDR" \
    --availability-zone "${AWS_REGION}a" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$VPC_NAME-public-1}]" \
    --region "$AWS_REGION" \
    --query "Subnet.SubnetId" \
    --output text)

PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block "$PUBLIC_SUBNET_2_CIDR" \
    --availability-zone "${AWS_REGION}b" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$VPC_NAME-public-2}]" \
    --region "$AWS_REGION" \
    --query "Subnet.SubnetId" \
    --output text)

echo "Public subnets created with IDs: $PUBLIC_SUBNET_1_ID, $PUBLIC_SUBNET_2_ID"

# Create private subnets
echo "Creating private subnets..."
PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block "$PRIVATE_SUBNET_1_CIDR" \
    --availability-zone "${AWS_REGION}a" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$VPC_NAME-private-1}]" \
    --region "$AWS_REGION" \
    --query "Subnet.SubnetId" \
    --output text)

PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block "$PRIVATE_SUBNET_2_CIDR" \
    --availability-zone "${AWS_REGION}b" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$VPC_NAME-private-2}]" \
    --region "$AWS_REGION" \
    --query "Subnet.SubnetId" \
    --output text)

echo "Private subnets created with IDs: $PRIVATE_SUBNET_1_ID, $PRIVATE_SUBNET_2_ID"

# Create route table for public subnets
echo "Creating route table for public subnets..."
PUBLIC_ROUTE_TABLE_ID=$(aws ec2 create-route-table \
    --vpc-id "$VPC_ID" \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=$VPC_NAME-public-rt}]" \
    --region "$AWS_REGION" \
    --query "RouteTable.RouteTableId" \
    --output text)

echo "Public route table created with ID: $PUBLIC_ROUTE_TABLE_ID"

# Create route to Internet Gateway
echo "Creating route to Internet Gateway..."
aws ec2 create-route \
    --route-table-id "$PUBLIC_ROUTE_TABLE_ID" \
    --destination-cidr-block "0.0.0.0/0" \
    --gateway-id "$IGW_ID" \
    --region "$AWS_REGION"

# Associate public subnets with public route table
echo "Associating public subnets with public route table..."
aws ec2 associate-route-table \
    --route-table-id "$PUBLIC_ROUTE_TABLE_ID" \
    --subnet-id "$PUBLIC_SUBNET_1_ID" \
    --region "$AWS_REGION"

aws ec2 associate-route-table \
    --route-table-id "$PUBLIC_ROUTE_TABLE_ID" \
    --subnet-id "$PUBLIC_SUBNET_2_ID" \
    --region "$AWS_REGION"

# Create security group for ALB and ECS
echo "Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for Economic Data Platform" \
    --vpc-id "$VPC_ID" \
    --region "$AWS_REGION" \
    --query "GroupId" \
    --output text)

echo "Security group created with ID: $SECURITY_GROUP_ID"

# Add inbound rules to security group
echo "Adding inbound rules to security group..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 80 \
    --cidr "0.0.0.0/0" \
    --region "$AWS_REGION"

aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 443 \
    --cidr "0.0.0.0/0" \
    --region "$AWS_REGION"

aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 5000 \
    --cidr "0.0.0.0/0" \
    --region "$AWS_REGION"

# Create ECS cluster
echo "Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name "$ECS_CLUSTER_NAME" \
    --region "$AWS_REGION"

echo "ECS cluster created: $ECS_CLUSTER_NAME"

# Create ECR repository for backend
echo "Creating ECR repository for backend..."
aws ecr create-repository \
    --repository-name "$ECR_BACKEND_REPO" \
    --region "$AWS_REGION"

echo "ECR repository created: $ECR_BACKEND_REPO"

# Create S3 bucket for frontend
echo "Creating S3 bucket for frontend..."
aws s3api create-bucket \
    --bucket "$S3_BUCKET_NAME" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"

echo "S3 bucket created: $S3_BUCKET_NAME"

# Configure S3 bucket for static website hosting
echo "Configuring S3 bucket for static website hosting..."
aws s3 website "s3://$S3_BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Create bucket policy for public read access
echo "Setting bucket policy for public read access..."
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET_NAME" \
    --policy file://bucket-policy.json

rm bucket-policy.json

# Create Application Load Balancer
echo "Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "$ALB_NAME" \
    --subnets "$PUBLIC_SUBNET_1_ID" "$PUBLIC_SUBNET_2_ID" \
    --security-groups "$SECURITY_GROUP_ID" \
    --region "$AWS_REGION" \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text)

echo "Application Load Balancer created with ARN: $ALB_ARN"

# Create target group for backend
echo "Creating target group for backend..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name "economic-data-backend-tg" \
    --protocol HTTP \
    --port 5000 \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-path "/api/health" \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --region "$AWS_REGION" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text)

echo "Target group created with ARN: $TARGET_GROUP_ARN"

# Create listener for ALB
echo "Creating listener for ALB..."
LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn="$TARGET_GROUP_ARN" \
    --region "$AWS_REGION" \
    --query "Listeners[0].ListenerArn" \
    --output text)

echo "Listener created with ARN: $LISTENER_ARN"

# Create IAM role for ECS task execution
echo "Creating IAM role for ECS task execution..."
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region "$AWS_REGION"

# Attach policy to ECS task execution role
echo "Attaching policy to ECS task execution role..."
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
    --region "$AWS_REGION"

echo "=== AWS infrastructure setup completed successfully ==="
echo "VPC ID: $VPC_ID"
echo "Public Subnet IDs: $PUBLIC_SUBNET_1_ID, $PUBLIC_SUBNET_2_ID"
echo "Private Subnet IDs: $PRIVATE_SUBNET_1_ID, $PRIVATE_SUBNET_2_ID"
echo "Security Group ID: $SECURITY_GROUP_ID"
echo "ECS Cluster: $ECS_CLUSTER_NAME"
echo "ECR Repository: $ECR_BACKEND_REPO"
echo "S3 Bucket: $S3_BUCKET_NAME"
echo "ALB ARN: $ALB_ARN"
echo "Target Group ARN: $TARGET_GROUP_ARN"
echo "Listener ARN: $LISTENER_ARN"
echo ""
echo "Next steps:"
echo "1. Update the subnet IDs and security group ID in deploy-backend.sh"
echo "2. Update the CloudFront distribution ID in deploy-frontend.sh after creating it"
echo "3. Run deploy-backend.sh to deploy the backend"
echo "4. Run deploy-frontend.sh to deploy the frontend"
