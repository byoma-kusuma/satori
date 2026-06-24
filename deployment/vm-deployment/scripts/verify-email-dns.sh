#!/usr/bin/env bash
#
# verify-email-dns.sh - Verify DNS configuration for Azure Communication Services
#
# This script checks if the required DNS records are properly configured
# for Azure Communication Services email delivery.
#
# Usage: ./verify-email-dns.sh <environment>
# Example: ./verify-email-dns.sh qa

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

check_arguments() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment not specified"
        echo "Usage: $0 <environment>"
        echo "Example: $0 qa"
        exit 1
    fi

    case "$ENVIRONMENT" in
        qa)
            EMAIL_DOMAIN="qa.mail.byomakusuma.com"
            ;;
        prod)
            EMAIL_DOMAIN="prod.mail.byomakusuma.com"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT (must be 'qa' or 'prod')"
            exit 1
            ;;
    esac

    log_info "Verifying DNS configuration for: $EMAIL_DOMAIN"
}

check_command() {
    if ! command -v dig &> /dev/null; then
        log_error "dig command not found. Please install dnsutils (Ubuntu/Debian) or bind-tools (RHEL/CentOS)"
        exit 1
    fi
}

check_spf_record() {
    log_check "Checking SPF record..."
    
    local spf_record=$(dig TXT "$EMAIL_DOMAIN" +short | grep "v=spf1" || echo "")
    
    if [[ -n "$spf_record" ]]; then
        echo -e "${GREEN}✓${NC} SPF record found:"
        echo "  $spf_record"
        
        if echo "$spf_record" | grep -q "include:spf.protection.outlook.com"; then
            echo -e "${GREEN}✓${NC} SPF includes Azure/Outlook"
        else
            log_warn "SPF record doesn't include Azure/Outlook"
            echo "  Expected: v=spf1 include:spf.protection.outlook.com -all"
        fi
    else
        log_error "SPF record not found"
        echo "  Add this TXT record to Cloudflare:"
        echo "  Name: $EMAIL_DOMAIN"
        echo "  Value: v=spf1 include:spf.protection.outlook.com -all"
    fi
    echo ""
}

check_dkim_records() {
    log_check "Checking DKIM records..."
    
    local selector1="selector1._domainkey.$EMAIL_DOMAIN"
    local selector2="selector2._domainkey.$EMAIL_DOMAIN"
    
    # Check selector1
    local dkim1=$(dig CNAME "$selector1" +short || echo "")
    if [[ -n "$dkim1" ]]; then
        echo -e "${GREEN}✓${NC} DKIM selector1 found:"
        echo "  $dkim1"
    else
        log_error "DKIM selector1 not found"
        echo "  Add this CNAME record to Cloudflare:"
        echo "  Name: selector1._domainkey.$EMAIL_DOMAIN"
        echo "  Value: <get-from-azure-portal>"
    fi
    
    # Check selector2
    local dkim2=$(dig CNAME "$selector2" +short || echo "")
    if [[ -n "$dkim2" ]]; then
        echo -e "${GREEN}✓${NC} DKIM selector2 found:"
        echo "  $dkim2"
    else
        log_error "DKIM selector2 not found"
        echo "  Add this CNAME record to Cloudflare:"
        echo "  Name: selector2._domainkey.$EMAIL_DOMAIN"
        echo "  Value: <get-from-azure-portal>"
    fi
    echo ""
}

check_domain_verification() {
    log_check "Checking Azure domain verification record..."
    
    local verification_record=$(dig TXT "_azurecomm.$EMAIL_DOMAIN" +short || echo "")
    
    if [[ -n "$verification_record" ]]; then
        echo -e "${GREEN}✓${NC} Domain verification record found:"
        echo "  $verification_record"
    else
        log_warn "Domain verification record not found"
        echo "  Add this TXT record to Cloudflare:"
        echo "  Name: _azurecomm.$EMAIL_DOMAIN"
        echo "  Value: <get-verification-code-from-azure-portal>"
    fi
    echo ""
}

check_dmarc_record() {
    log_check "Checking DMARC record (optional but recommended)..."
    
    local dmarc_record=$(dig TXT "_dmarc.$EMAIL_DOMAIN" +short || echo "")
    
    if [[ -n "$dmarc_record" ]]; then
        echo -e "${GREEN}✓${NC} DMARC record found:"
        echo "  $dmarc_record"
    else
        log_warn "DMARC record not found (optional)"
        echo "  Consider adding this TXT record to Cloudflare:"
        echo "  Name: _dmarc.$EMAIL_DOMAIN"
        echo "  Value: v=DMARC1; p=none; rua=mailto:dmarc@byomakusuma.com"
    fi
    echo ""
}

check_mx_record() {
    log_check "Checking MX record (not required for Azure Communication Services)..."
    
    local mx_record=$(dig MX "$EMAIL_DOMAIN" +short || echo "")
    
    if [[ -n "$mx_record" ]]; then
        echo -e "${BLUE}ℹ${NC} MX record found (not required for sending):"
        echo "  $mx_record"
    else
        echo -e "${BLUE}ℹ${NC} No MX record (this is OK - Azure Communication Services doesn't require MX records for sending)"
    fi
    echo ""
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "DNS Verification Summary"
    echo "=========================================="
    echo ""
    echo "Domain: $EMAIL_DOMAIN"
    echo ""
    echo "Next steps:"
    echo "  1. If any records are missing, add them in Cloudflare"
    echo "  2. Get exact DNS values from Azure Portal:"
    echo "     - Go to Communication Service → Email → Domains"
    echo "     - Select your domain and click 'Configure'"
    echo "  3. Wait 5-60 minutes for DNS propagation"
    echo "  4. Verify domain in Azure Portal"
    echo "  5. Test email sending from your application"
    echo ""
    echo "For detailed instructions, see:"
    echo "  satori/deployment/vm-deployment/EMAIL_SETUP_GUIDE.md"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "Azure Communication Services DNS Checker"
    echo "=========================================="
    echo ""

    check_arguments
    check_command
    echo ""
    
    check_spf_record
    check_dkim_records
    check_domain_verification
    check_dmarc_record
    check_mx_record
    
    print_summary
}

main "$@"
