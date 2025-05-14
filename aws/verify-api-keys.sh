#!/bin/bash
# Script to verify API keys before deployment

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
ENV_FILE="../backend/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Environment file $ENV_FILE not found. Please create it first."
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

echo "=== Verifying API keys for production deployment ==="

# Function to check if a variable is set and not a placeholder
check_api_key() {
    local key_name=$1
    local key_value=$2
    local placeholder=$3
    
    if [ -z "$key_value" ]; then
        echo " $key_name is not set"
        return 1
    elif [ "$key_value" == "$placeholder" ]; then
        echo " $key_name is still set to the placeholder value: $placeholder"
        return 1
    else
        echo " $key_name is properly set"
        return 0
    fi
}

# Check all required API keys
errors=0

# FRED API Key
check_api_key "FRED_API_KEY" "$FRED_API_KEY" "your_fred_api_key"
errors=$((errors + $?))

# BEA API Key
check_api_key "BEA_API_KEY" "$BEA_API_KEY" "your_bea_api_key"
errors=$((errors + $?))

# Census API Key
check_api_key "CENSUS_API_KEY" "$CENSUS_API_KEY" "your_census_api_key"
errors=$((errors + $?))

# BLS API Key
check_api_key "BLS_API_KEY" "$BLS_API_KEY" "your_bls_api_key"
errors=$((errors + $?))

# Check JWT Secret
check_api_key "JWT_SECRET" "$JWT_SECRET" "your_jwt_secret"
errors=$((errors + $?))

# Check Supabase keys
check_api_key "SUPABASE_URL" "$SUPABASE_URL" "your_supabase_url"
errors=$((errors + $?))

check_api_key "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "your_supabase_anon_key"
errors=$((errors + $?))

check_api_key "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY" "your_supabase_service_key"
errors=$((errors + $?))

# Summary
if [ $errors -gt 0 ]; then
    echo ""
    echo " Found $errors issues with API keys"
    echo "Please update the .env file with valid API keys before deploying to production"
    exit 1
else
    echo ""
    echo " All API keys are properly configured for production deployment"
    echo "You can proceed with the deployment"
fi