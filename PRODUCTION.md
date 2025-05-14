# Production Deployment Guide

This guide explains how to deploy the Economic Data Integration Platform to production, ensuring all data is fetched directly from APIs without using mock data.

## Prerequisites

Before deploying to production, ensure you have:

1. **Valid API Keys** for all external services:
   - FRED API (St. Louis Federal Reserve)
   - BEA API (Bureau of Economic Analysis)
   - Census API
   - BLS API (Bureau of Labor Statistics)

2. **Supabase Configuration**:
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Key

3. **AWS Account** with appropriate permissions

## Step 1: Configure Environment Variables

1. Copy the production template to create your .env file:
   ```bash
   cp backend/.env.production.template backend/.env
   ```

2. Edit the .env file and replace all placeholder values with your actual API keys and configuration.

3. Verify your API keys are correctly set:
   ```bash
   cd aws
   bash verify-api-keys.sh
   ```

## Step 2: Set Up AWS Infrastructure

1. Run the infrastructure setup script:
   ```bash
   cd aws
   bash setup-infrastructure.sh
   ```

2. Note the output values (subnet IDs, security group ID, etc.) as you'll need them for the next steps.

## Step 3: Deploy the Backend

1. Update the subnet IDs and security group ID in the deploy-backend.sh script based on the output from the infrastructure setup.

2. Deploy the backend:
   ```bash
   cd aws
   bash deploy-backend.sh
   ```

3. The backend will be deployed to AWS ECS with the following configuration:
   - `NODE_ENV=production`
   - `USE_MOCK_DATA=false`
   - `FALLBACK_TO_MOCK=false`

   This ensures all data is fetched directly from the APIs.

## Step 4: Deploy the Frontend

1. Create a CloudFront distribution for your S3 bucket if not already created.

2. Update the CloudFront distribution ID in deploy-frontend.sh.

3. Deploy the frontend:
   ```bash
   cd aws
   bash deploy-frontend.sh
   ```

## Step 5: Verify the Deployment

1. Check the ECS service status:
   ```bash
   aws ecs describe-services --cluster economic-data-cluster --services backend-service --region us-east-1
   ```

2. Verify the CloudFront distribution is working:
   ```bash
   aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID --region us-east-1
   ```

3. Test the application by accessing the CloudFront URL.

## Monitoring and Maintenance

### API Key Rotation

If you need to rotate API keys:

1. Update the keys in the AWS ECS task definition:
   ```bash
   aws ecs update-task-definition --cli-input-json file://updated-task-definition.json
   ```

2. Update the service to use the new task definition:
   ```bash
   aws ecs update-service --cluster economic-data-cluster --service backend-service --task-definition NEW_TASK_DEFINITION_ARN
   ```

### Handling API Outages

If an external API experiences an outage:

1. Temporarily enable the fallback mechanism by updating the ECS task definition to set `FALLBACK_TO_MOCK=true`.

2. Deploy the updated task definition.

3. Once the API is back online, revert to `FALLBACK_TO_MOCK=false`.

## Troubleshooting

### API Rate Limits

If you encounter rate limit issues:

1. Implement caching in the backend services to reduce API calls.
2. Consider upgrading to paid API tiers if available.
3. Implement request throttling to stay within rate limits.

### Missing Data

If certain data is missing:

1. Check the CloudWatch logs for the ECS service to see if there are API errors.
2. Verify the API keys are still valid.
3. Check if the data source API has changed its endpoints or response format.