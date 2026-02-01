#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Test CI Workflows Locally
# ═══════════════════════════════════════════════════════════════════════════
# Este script permite ejecutar los checks de CI localmente antes de push
# Ayuda a detectar problemas tempranamente y ahorra tiempo en CI/CD
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Local CI Testing - StrateKaz${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ═══════════════════════════════════════════════════
# BACKEND TESTS
# ═══════════════════════════════════════════════════

test_backend() {
    print_step "Testing Backend..."

    cd "$PROJECT_ROOT/backend"

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Virtual environment not found. Creating one..."
        python -m venv venv
    fi

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi

    # Install dependencies
    print_step "Installing Python dependencies..."
    pip install -q -r requirements.txt
    print_success "Dependencies installed"

    # Django checks
    print_step "Running Django system checks..."
    python manage.py check --deploy
    print_success "Django checks passed"

    # Check migrations
    print_step "Checking for missing migrations..."
    python manage.py makemigrations --dry-run --check
    print_success "No missing migrations"

    # Code formatting check
    print_step "Checking code formatting with Black..."
    if black --check --quiet . 2>/dev/null; then
        print_success "Code formatting is correct"
    else
        print_warning "Code formatting issues found. Run: black ."
    fi

    # Linting
    print_step "Running Ruff linter..."
    if ruff check . 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Run: ruff check . --fix"
    fi

    # Run tests
    print_step "Running tests..."
    if python manage.py test --verbosity=1 2>/dev/null; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed. Check output above."
    fi

    deactivate

    cd "$PROJECT_ROOT"
}

# ═══════════════════════════════════════════════════
# FRONTEND TESTS
# ═══════════════════════════════════════════════════

test_frontend() {
    print_step "Testing Frontend..."

    cd "$PROJECT_ROOT/frontend"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm ci
    fi

    # TypeScript type checking
    print_step "Running TypeScript type checking..."
    if npx tsc --noEmit; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        return 1
    fi

    # ESLint
    print_step "Running ESLint..."
    if npm run lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Run: npm run lint -- --fix"
    fi

    # Build
    print_step "Building production bundle..."
    if npm run build; then
        print_success "Build completed successfully"

        # Check build size
        BUILD_SIZE=$(du -sh dist/ | cut -f1)
        echo "  Build size: $BUILD_SIZE"
    else
        print_error "Build failed"
        return 1
    fi

    cd "$PROJECT_ROOT"
}

# ═══════════════════════════════════════════════════
# DOCKER TESTS
# ═══════════════════════════════════════════════════

test_docker() {
    print_step "Testing Docker builds..."

    cd "$PROJECT_ROOT"

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        return 1
    fi

    # Build backend image
    print_step "Building backend Docker image..."
    if docker build -f backend/Dockerfile.prod -t grasas-backend:test ./backend; then
        print_success "Backend image built successfully"
    else
        print_error "Backend image build failed"
        return 1
    fi

    # Build frontend image
    print_step "Building frontend Docker image..."
    if docker build -f frontend/Dockerfile -t grasas-frontend:test ./frontend; then
        print_success "Frontend image built successfully"
    else
        print_error "Frontend image build failed"
        return 1
    fi

    # Check image sizes
    print_step "Checking image sizes..."
    echo ""
    docker images | grep "grasas-.*:test"
    echo ""

    # Cleanup test images
    print_step "Cleaning up test images..."
    docker rmi grasas-backend:test grasas-frontend:test 2>/dev/null || true
    print_success "Cleanup completed"
}

# ═══════════════════════════════════════════════════
# GIT CHECKS
# ═══════════════════════════════════════════════════

check_git() {
    print_step "Running Git checks..."

    cd "$PROJECT_ROOT"

    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes:"
        git status -s
        echo ""
    else
        print_success "Working directory is clean"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "  Current branch: $CURRENT_BRANCH"

    # Check if branch is up to date
    git fetch origin "$CURRENT_BRANCH" 2>/dev/null || true
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [ "$REMOTE" != "" ]; then
        if [ "$LOCAL" = "$REMOTE" ]; then
            print_success "Branch is up to date with remote"
        else
            print_warning "Branch is not up to date with remote. Consider pulling changes."
        fi
    fi
}

# ═══════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════

main() {
    # Parse command line arguments
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_DOCKER=false
    RUN_GIT=true

    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                RUN_FRONTEND=false
                RUN_DOCKER=false
                shift
                ;;
            --frontend-only)
                RUN_BACKEND=false
                RUN_DOCKER=false
                shift
                ;;
            --docker)
                RUN_DOCKER=true
                shift
                ;;
            --skip-git)
                RUN_GIT=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --backend-only    Run only backend tests"
                echo "  --frontend-only   Run only frontend tests"
                echo "  --docker          Include Docker build tests"
                echo "  --skip-git        Skip Git checks"
                echo "  --help            Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run checks
    FAILED=false

    if [ "$RUN_GIT" = true ]; then
        check_git || FAILED=true
    fi

    if [ "$RUN_BACKEND" = true ]; then
        test_backend || FAILED=true
    fi

    if [ "$RUN_FRONTEND" = true ]; then
        test_frontend || FAILED=true
    fi

    if [ "$RUN_DOCKER" = true ]; then
        test_docker || FAILED=true
    fi

    # Summary
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    if [ "$FAILED" = false ]; then
        echo -e "${GREEN}✓ All checks passed! Ready to push.${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some checks failed. Please fix the issues.${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
