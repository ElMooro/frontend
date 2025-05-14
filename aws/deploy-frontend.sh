#!/bin/bash
# AWS Deployment Script for Frontend
# This script deploys the React frontend to AWS S3 and CloudFront

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
AWS_REGION="us-east-1"
S3_BUCKET_NAME="economic-data-platform"
CLOUDFRONT_DISTRIBUTION_ID="E1EXAMPLE123456"
ENV_FILE="../frontend/.env"
BUILD_DIR="../frontend/build"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE not found. Please create it first."
    exit 1
fi

echo "=== Starting frontend deployment ==="

# Build the React application
echo "Building React application..."
cd ../frontend

# Ensure we have the latest dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Creating production build..."
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "Build failed. Build directory not found."
    exit 1
fi

# Check if S3 bucket exists, create if it doesn't
echo "Checking if S3 bucket exists..."
if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "Creating S3 bucket..."
    aws s3api create-bucket \
        --bucket "$S3_BUCKET_NAME" \
        --region "$AWS_REGION" \
        --create-bucket-configuration LocationConstraint="$AWS_REGION"
    
    # Configure bucket for static website hosting
    echo "Configuring bucket for static website hosting..."
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
fi

# Upload the build files to S3
echo "Uploading build files to S3..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" \
    --delete \
    --region "$AWS_REGION" \
    --cache-control "max-age=31536000,public,immutable" \
    --exclude "index.html" \
    --exclude "asset-manifest.json" \
    --exclude "manifest.json"

# Upload HTML and JSON files with different cache settings
echo "Uploading HTML and JSON files with no-cache settings..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" \
    --region "$AWS_REGION" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --include "index.html" \
    --include "asset-manifest.json" \
    --include "manifest.json"

# Check if CloudFront distribution exists
echo "Checking CloudFront distribution..."
if aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --region "$AWS_REGION" &>/dev/null; then
    # Create CloudFront invalidation to clear cache
    echo "Creating CloudFront invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --region "$AWS_REGION" \
        --query "Invalidation.Id" \
        --output text)
    
    echo "CloudFront invalidation created with ID: $INVALIDATION_ID"
    echo "You can check the status with: aws cloudfront get-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --id $INVALIDATION_ID --region $AWS_REGION"
else
    echo "CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID not found."
    echo "You may need to create a CloudFront distribution manually or update the CLOUDFRONT_DISTRIBUTION_ID in this script."
    
    # Provide instructions for creating a CloudFront distribution
    echo "To create a CloudFront distribution for your S3 bucket, run:"
    echo "aws cloudfront create-distribution --origin-domain-name $S3_BUCKET_NAME.s3.amazonaws.com --default-root-object index.html"
fi

echo "=== Frontend deployment completed successfully ==="
echo "Website URL: http://$S3_BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
if aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --region "$AWS_REGION" &>/dev/null; then
    DOMAIN_NAME=$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --region "$AWS_REGION" --query "Distribution.DomainName" --output text)
    echo "CloudFront URL: https://$DOMAIN_NAME"
fi
