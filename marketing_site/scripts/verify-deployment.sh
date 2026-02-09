#!/bin/bash
#
# Marketing Site Deployment Verification Script
# Tests all critical aspects of the deployment
#
# Usage: ./scripts/verify-deployment.sh [URL]
# Example: ./scripts/verify-deployment.sh https://stratekaz.com

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default URL
URL="${1:-https://stratekaz.com}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

# Check if URL is accessible
check_url() {
    local url=$1
    local expected_code=${2:-200}
    local description=$3

    local response_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url")

    if [ "$response_code" -eq "$expected_code" ]; then
        print_success "$description - HTTP $response_code"
        return 0
    else
        print_fail "$description - Expected HTTP $expected_code, got $response_code"
        return 1
    fi
}

# Check response time
check_response_time() {
    local url=$1
    local max_time=${2:-3}

    local time_total=$(curl -s -o /dev/null -w "%{time_total}" "$url")
    local time_int=$(echo "$time_total" | cut -d'.' -f1)

    if [ -z "$time_int" ]; then
        time_int=0
    fi

    if (( $(echo "$time_total < $max_time" | bc -l 2>/dev/null || echo "0") )); then
        print_success "Response time: ${time_total}s (< ${max_time}s)"
    else
        print_warning "Response time: ${time_total}s (target < ${max_time}s)"
    fi
}

# Check SSL certificate
check_ssl() {
    local domain=$(echo "$URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')

    print_info "Checking SSL certificate for $domain..."

    # Get certificate expiry
    local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                   openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$expiry" ]; then
        print_success "SSL certificate valid until: $expiry"

        # Check if expiring soon (30 days)
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null || echo "0")
        local now_epoch=$(date +%s)
        local days_left=$(( ($expiry_epoch - $now_epoch) / 86400 ))

        if [ "$days_left" -lt 30 ]; then
            print_warning "SSL certificate expires in $days_left days!"
        else
            print_info "SSL certificate valid for $days_left more days"
        fi
    else
        print_fail "Could not retrieve SSL certificate"
    fi
}

# Check security headers
check_security_headers() {
    local url=$1

    print_info "Checking security headers..."

    local headers=$(curl -s -I "$url")

    # Check HSTS
    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        print_success "HSTS header present"
    else
        print_fail "HSTS header missing"
    fi

    # Check X-Frame-Options
    if echo "$headers" | grep -qi "X-Frame-Options"; then
        print_success "X-Frame-Options header present"
    else
        print_fail "X-Frame-Options header missing"
    fi

    # Check Content-Security-Policy
    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        print_success "Content-Security-Policy header present"
    else
        print_warning "Content-Security-Policy header missing"
    fi

    # Check X-Content-Type-Options
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        print_success "X-Content-Type-Options header present"
    else
        print_fail "X-Content-Type-Options header missing"
    fi
}

# Check page content
check_page_content() {
    local url=$1

    print_info "Checking page content..."

    local content=$(curl -s "$url")

    # Check for basic HTML structure
    if echo "$content" | grep -q "<html"; then
        print_success "Valid HTML structure"
    else
        print_fail "Invalid HTML structure"
    fi

    # Check for React app
    if echo "$content" | grep -q "root"; then
        print_success "React root element found"
    else
        print_fail "React root element not found"
    fi

    # Check for cache-killer.js
    if echo "$content" | grep -q "cache-killer.js"; then
        print_success "cache-killer.js script present"
    else
        print_warning "cache-killer.js script not found"
    fi

    # Check version
    local version=$(curl -s "$url/version.json" 2>/dev/null)
    if [ -n "$version" ]; then
        print_success "version.json accessible"
        print_info "Version info: $version"
    else
        print_warning "version.json not found (may be normal)"
    fi
}

# Check all critical pages
check_all_pages() {
    print_header "CHECKING ALL PAGES"

    check_url "$URL/" 200 "Home page"
    check_url "$URL/pricing" 200 "Pricing page"
    check_url "$URL/contact" 200 "Contact page"
    check_url "$URL/register" 200 "Register page"

    # Check for non-existent page (should redirect to /)
    check_url "$URL/non-existent-page-12345" 200 "404 handling (SPA routing)"
}

# Check assets
check_assets() {
    print_header "CHECKING STATIC ASSETS"

    print_info "Fetching asset list from page..."
    local content=$(curl -s "$URL/")

    # Extract CSS files
    local css_files=$(echo "$content" | grep -oP '(?<=href=")[^"]*\.css' | head -1)
    if [ -n "$css_files" ]; then
        check_url "$URL$css_files" 200 "Main CSS file"
    else
        print_warning "No CSS files found in HTML"
    fi

    # Extract JS files
    local js_files=$(echo "$content" | grep -oP '(?<=src=")[^"]*\.js' | head -1)
    if [ -n "$js_files" ]; then
        check_url "$URL$js_files" 200 "Main JS file"
    else
        print_warning "No JS files found in HTML"
    fi

    # Check common assets
    check_url "$URL/favicon.ico" 200 "Favicon"
    check_url "$URL/logo.svg" 200 "Logo SVG"
}

# Main execution
main() {
    print_header "MARKETING SITE DEPLOYMENT VERIFICATION"
    print_info "Target URL: $URL"
    print_info "Timestamp: $(date)"

    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}ERROR: curl is not installed${NC}"
        exit 1
    fi

    # 1. Basic connectivity
    print_header "BASIC CONNECTIVITY"
    check_url "$URL" 200 "Site is accessible"
    check_response_time "$URL" 3

    # 2. SSL/TLS
    print_header "SSL/TLS VERIFICATION"
    if [[ $URL == https://* ]]; then
        check_ssl
    else
        print_warning "URL is not HTTPS, skipping SSL checks"
    fi

    # 3. Security headers
    print_header "SECURITY HEADERS"
    check_security_headers "$URL"

    # 4. Page content
    print_header "PAGE CONTENT VERIFICATION"
    check_page_content "$URL"

    # 5. All pages
    check_all_pages

    # 6. Static assets
    check_assets

    # 7. Health check endpoint (if exists)
    print_header "HEALTH CHECK"
    if curl -s "$URL/health" | grep -q "healthy" 2>/dev/null; then
        print_success "Health endpoint responding correctly"
    else
        print_warning "Health endpoint not found or not responding (may not be implemented)"
    fi

    # Summary
    print_header "SUMMARY"
    echo -e "Total Tests: $(($PASSED + $FAILED + $WARNINGS))"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

    # Exit code
    if [ $FAILED -gt 0 ]; then
        echo -e "\n${RED}❌ DEPLOYMENT VERIFICATION FAILED${NC}"
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  DEPLOYMENT VERIFICATION PASSED WITH WARNINGS${NC}"
        exit 0
    else
        echo -e "\n${GREEN}✅ DEPLOYMENT VERIFICATION PASSED${NC}"
        exit 0
    fi
}

# Run main function
main "$@"
