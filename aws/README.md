# AWS Deployment Guide

This directory contains scripts for deploying the Economic Data Integration Platform to AWS.

## Prerequisites

Before running these scripts, ensure you have:

1. **AWS CLI** installed and configured with appropriate credentials
2. **Docker** installed for building and pushing container images
3. **Git Bash** or similar Bash-compatible shell on Windows

## Deployment Scripts

### 1. Setup Infrastructure

The `setup-infrastructure.sh` script creates all the necessary AWS resources:

- VPC with public and private subnets
- Internet Gateway and route tables
- Security groups
- ECS cluster
- ECR repository
- S3 bucket for frontend
- Application Load Balancer
- Target groups and listeners
- IAM roles

**Usage:**
```bash
bash setup-infrastructure.sh
```

### 2. Deploy Backend

The `deploy-backend.sh` script:

- Builds a Docker image of the backend
- Pushes it to ECR
- Updates the ECS service

**Usage:**
```bash
bash deploy-backend.sh
```

### 3. Deploy Frontend

The `deploy-frontend.sh` script:

- Builds the React application
- Uploads it to S3
- Creates a CloudFront invalidation

**Usage:**
```bash
bash deploy-frontend.sh
```

## Important Notes

1. **Subnet IDs and Security Group ID**: After running `setup-infrastructure.sh`, you'll need to update the subnet IDs and security group ID in `deploy-backend.sh`.

2. **CloudFront Distribution ID**: After creating a CloudFront distribution, update the `CLOUDFRONT_DISTRIBUTION_ID` in `deploy-frontend.sh`.

3. **Environment Variables**: Make sure your `.env` files in both frontend and backend directories are properly configured before deployment.

4. **Windows Users**: These scripts are designed to be run in a Bash-compatible shell like Git Bash. They won't work directly in Windows Command Prompt or PowerShell.

## Deployment Workflow

1. Run `setup-infrastructure.sh` to create all AWS resources
2. Update the subnet IDs and security group ID in `deploy-backend.sh`
3. Run `deploy-backend.sh` to deploy the backend
4. Create a CloudFront distribution for your S3 bucket
5. Update the CloudFront distribution ID in `deploy-frontend.sh`
6. Run `deploy-frontend.sh` to deploy the frontend

## Troubleshooting

If you encounter issues:

1. Check AWS CloudWatch logs for ECS service errors
2. Verify that all environment variables are correctly set
3. Ensure your AWS CLI has the necessary permissions
4. Check that your S3 bucket policy allows public read access
5. Verify that your security groups allow traffic on the necessary ports