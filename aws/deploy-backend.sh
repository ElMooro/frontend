#!/bin/bash
# AWS Deployment Script for Backend
# This script deploys the backend to AWS ECS

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY_NAME="economic-data-backend"
ECS_CLUSTER_NAME="economic-data-cluster"
ECS_SERVICE_NAME="backend-service"
ECS_TASK_FAMILY="backend-task"
CONTAINER_NAME="backend-container"
CONTAINER_PORT=5000
HOST_PORT=5000
CPU_UNITS=256
MEMORY=512
ENV_FILE="../backend/.env"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install it first."
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE not found. Please create it first."
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Verify API keys before deployment
echo "Verifying API keys..."
bash ./verify-api-keys.sh
if [ $? -ne 0 ]; then
    echo "API key verification failed. Please fix the issues before deploying."
    exit 1
fi

echo "=== Starting backend deployment ==="

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo "Failed to get AWS account ID. Make sure you're authenticated with AWS CLI."
    exit 1
fi

# Create ECR repository if it doesn't exist
echo "Checking if ECR repository exists..."
if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION"
fi

# Get ECR login token and login to Docker
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build Docker image
echo "Building Docker image..."
cd ../backend
docker build -t "$ECR_REPOSITORY_NAME:latest" .

# Tag the image
echo "Tagging Docker image..."
docker tag "$ECR_REPOSITORY_NAME:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"

# Push the image to ECR
echo "Pushing Docker image to ECR..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"

# Check if ECS cluster exists, create if it doesn't
echo "Checking if ECS cluster exists..."
if ! aws ecs describe-clusters --clusters "$ECS_CLUSTER_NAME" --region "$AWS_REGION" --query "clusters[?clusterName=='$ECS_CLUSTER_NAME']" --output text | grep -q "$ECS_CLUSTER_NAME"; then
    echo "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name "$ECS_CLUSTER_NAME" --region "$AWS_REGION"
fi

# Create task definition JSON
echo "Creating task definition..."
cat > task-definition.json << EOF
{
    "family": "$ECS_TASK_FAMILY",
    "networkMode": "awsvpc",
    "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "$CONTAINER_NAME",
            "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": $CONTAINER_PORT,
                    "hostPort": $HOST_PORT,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "NODE_ENV", "value": "production"},
                {"name": "PORT", "value": "$CONTAINER_PORT"},
                {"name": "SUPABASE_URL", "value": "$SUPABASE_URL"},
                {"name": "SUPABASE_ANON_KEY", "value": "$SUPABASE_ANON_KEY"},
                {"name": "SUPABASE_SERVICE_KEY", "value": "$SUPABASE_SERVICE_KEY"},
                {"name": "FRED_API_KEY", "value": "$FRED_API_KEY"},
                {"name": "BEA_API_KEY", "value": "$BEA_API_KEY"},
                {"name": "CENSUS_API_KEY", "value": "$CENSUS_API_KEY"},
                {"name": "BLS_API_KEY", "value": "$BLS_API_KEY"},
                {"name": "FRONTEND_URL", "value": "https://economic-data-platform.com"},
                {"name": "JWT_SECRET", "value": "$JWT_SECRET"},
                {"name": "USE_MOCK_DATA", "value": "false"},
                {"name": "FALLBACK_TO_MOCK", "value": "false"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/$ECS_TASK_FAMILY",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ],
    "requiresCompatibilities": [
        "FARGATE"
    ],
    "cpu": "$CPU_UNITS",
    "memory": "$MEMORY"
}
EOF

# Register the task definition
echo "Registering task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://task-definition.json --region "$AWS_REGION" --query "taskDefinition.taskDefinitionArn" --output text)
rm task-definition.json

# Check if service exists
echo "Checking if ECS service exists..."
if aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --region "$AWS_REGION" --query "services[?serviceName=='$ECS_SERVICE_NAME']" --output text | grep -q "$ECS_SERVICE_NAME"; then
    # Update the service
    echo "Updating ECS service..."
    aws ecs update-service --cluster "$ECS_CLUSTER_NAME" --service "$ECS_SERVICE_NAME" --task-definition "$TASK_DEFINITION_ARN" --region "$AWS_REGION"
else
    # Create the service
    echo "Creating ECS service..."
    aws ecs create-service \
        --cluster "$ECS_CLUSTER_NAME" \
        --service-name "$ECS_SERVICE_NAME" \
        --task-definition "$TASK_DEFINITION_ARN" \
        --desired-count 1 \
        --launch-type "FARGATE" \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
        --region "$AWS_REGION"
fi

echo "=== Backend deployment completed successfully ==="
echo "Service URL: http://your-load-balancer-url:$HOST_PORT"
echo "Note: You need to set up an Application Load Balancer to route traffic to your service."
echo "Run 'aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_SERVICE_NAME --region $AWS_REGION' to check deployment status."
