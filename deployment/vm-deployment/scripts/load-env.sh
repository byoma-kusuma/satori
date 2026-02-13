#!/usr/bin/env bash
#
# load-env.sh - Load and validate deployment environment variables
#
# Usage: source scripts/load-env.sh
# Or in scripts: source "$(dirname "$0")/load-env.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$DEPLOYMENT_ROOT/.env"

# Check if .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${YELLOW}[WARN]${NC} .env file not found at: $ENV_FILE"
    echo -e "${YELLOW}[WARN]${NC} Copy .env.template to .env and configure your values:"
    echo -e "${YELLOW}[WARN]${NC}   cp $DEPLOYMENT_ROOT/.env.template $ENV_FILE"
    echo -e "${YELLOW}[WARN]${NC} Using placeholder values from scripts..."
    return 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

echo -e "${GREEN}[INFO]${NC} Loaded deployment configuration from .env"

# Validate required variables
REQUIRED_VARS=(
    "QA_SSH_ALIAS"
    "PROD_SSH_ALIAS"
    "QA_VM_IP"
    "PROD_VM_IP"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo -e "${RED}[ERROR]${NC} Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}[ERROR]${NC}   - $var"
    done
    echo -e "${RED}[ERROR]${NC} Please configure these in: $ENV_FILE"
    return 1
fi

echo -e "${GREEN}[INFO]${NC} Configuration validated successfully"
echo -e "${GREEN}[INFO]${NC}   QA SSH: $QA_SSH_ALIAS ($QA_VM_IP)"
echo -e "${GREEN}[INFO]${NC}   Prod SSH: $PROD_SSH_ALIAS ($PROD_VM_IP)"

return 0
