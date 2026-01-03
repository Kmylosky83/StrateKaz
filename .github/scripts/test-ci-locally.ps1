# ═══════════════════════════════════════════════════════════════════════════
# Test CI Workflows Locally (PowerShell Version)
# ═══════════════════════════════════════════════════════════════════════════
# Este script permite ejecutar los checks de CI localmente antes de push
# Ayuda a detectar problemas tempranamente y ahorra tiempo en CI/CD
# Versión para Windows PowerShell
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Docker,
    [switch]$SkipGit,
    [switch]$Help
)

# Stop on errors
$ErrorActionPreference = "Stop"

# Project root directory
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

# Colors
function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════
# HELP
# ═══════════════════════════════════════════════════

if ($Help) {
    Write-Host "Usage: .\test-ci-locally.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -BackendOnly    Run only backend tests"
    Write-Host "  -FrontendOnly   Run only frontend tests"
    Write-Host "  -Docker         Include Docker build tests"
    Write-Host "  -SkipGit        Skip Git checks"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    exit 0
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  Local CI Testing - StrateKaz" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# ═══════════════════════════════════════════════════
# BACKEND TESTS
# ═══════════════════════════════════════════════════

function Test-Backend {
    Write-Step "Testing Backend..."

    Push-Location "$ProjectRoot\backend"

    try {
        # Check if virtual environment exists
        if (-not (Test-Path "venv")) {
            Write-Warning-Custom "Virtual environment not found. Creating one..."
            python -m venv venv
        }

        # Activate virtual environment
        & "venv\Scripts\Activate.ps1"

        # Install dependencies
        Write-Step "Installing Python dependencies..."
        pip install -q -r requirements.txt
        Write-Success "Dependencies installed"

        # Django checks
        Write-Step "Running Django system checks..."
        python manage.py check --deploy
        Write-Success "Django checks passed"

        # Check migrations
        Write-Step "Checking for missing migrations..."
        python manage.py makemigrations --dry-run --check
        Write-Success "No missing migrations"

        # Code formatting check
        Write-Step "Checking code formatting with Black..."
        $blackOutput = black --check --quiet . 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Code formatting is correct"
        } else {
            Write-Warning-Custom "Code formatting issues found. Run: black ."
        }

        # Linting
        Write-Step "Running Ruff linter..."
        $ruffOutput = ruff check . 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Linting passed"
        } else {
            Write-Warning-Custom "Linting issues found. Run: ruff check . --fix"
        }

        # Run tests
        Write-Step "Running tests..."
        $testOutput = python manage.py test --verbosity=1 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All tests passed"
        } else {
            Write-Warning-Custom "Some tests failed. Check output above."
        }

        deactivate

    } catch {
        Write-Error-Custom "Backend tests failed: $_"
        Pop-Location
        return $false
    }

    Pop-Location
    return $true
}

# ═══════════════════════════════════════════════════
# FRONTEND TESTS
# ═══════════════════════════════════════════════════

function Test-Frontend {
    Write-Step "Testing Frontend..."

    Push-Location "$ProjectRoot\frontend"

    try {
        # Check if node_modules exists
        if (-not (Test-Path "node_modules")) {
            Write-Warning-Custom "node_modules not found. Installing dependencies..."
            npm ci
        }

        # TypeScript type checking
        Write-Step "Running TypeScript type checking..."
        npx tsc --noEmit
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Type checking passed"
        } else {
            Write-Error-Custom "Type checking failed"
            Pop-Location
            return $false
        }

        # ESLint
        Write-Step "Running ESLint..."
        npm run lint 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Linting passed"
        } else {
            Write-Warning-Custom "Linting issues found. Run: npm run lint -- --fix"
        }

        # Build
        Write-Step "Building production bundle..."
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build completed successfully"

            # Check build size
            $buildSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "  Build size: $([math]::Round($buildSize, 2)) MB"
        } else {
            Write-Error-Custom "Build failed"
            Pop-Location
            return $false
        }

    } catch {
        Write-Error-Custom "Frontend tests failed: $_"
        Pop-Location
        return $false
    }

    Pop-Location
    return $true
}

# ═══════════════════════════════════════════════════
# DOCKER TESTS
# ═══════════════════════════════════════════════════

function Test-Docker {
    Write-Step "Testing Docker builds..."

    Push-Location $ProjectRoot

    try {
        # Check if Docker is running
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Docker is not running. Please start Docker Desktop."
            Pop-Location
            return $false
        }

        # Build backend image
        Write-Step "Building backend Docker image..."
        docker build -f backend\Dockerfile.prod -t grasas-backend:test .\backend
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend image built successfully"
        } else {
            Write-Error-Custom "Backend image build failed"
            Pop-Location
            return $false
        }

        # Build frontend image
        Write-Step "Building frontend Docker image..."
        docker build -f frontend\Dockerfile -t grasas-frontend:test .\frontend
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend image built successfully"
        } else {
            Write-Error-Custom "Frontend image build failed"
            Pop-Location
            return $false
        }

        # Check image sizes
        Write-Step "Checking image sizes..."
        Write-Host ""
        docker images | Select-String "grasas-.*:test"
        Write-Host ""

        # Cleanup test images
        Write-Step "Cleaning up test images..."
        docker rmi grasas-backend:test grasas-frontend:test 2>&1 | Out-Null
        Write-Success "Cleanup completed"

    } catch {
        Write-Error-Custom "Docker tests failed: $_"
        Pop-Location
        return $false
    }

    Pop-Location
    return $true
}

# ═══════════════════════════════════════════════════
# GIT CHECKS
# ═══════════════════════════════════════════════════

function Check-Git {
    Write-Step "Running Git checks..."

    Push-Location $ProjectRoot

    try {
        # Check for uncommitted changes
        $status = git status --porcelain
        if ($status) {
            Write-Warning-Custom "You have uncommitted changes:"
            git status -s
            Write-Host ""
        } else {
            Write-Success "Working directory is clean"
        }

        # Check current branch
        $currentBranch = git branch --show-current
        Write-Host "  Current branch: $currentBranch"

        # Check if branch is up to date
        git fetch origin $currentBranch 2>&1 | Out-Null

        $local = git rev-parse @
        try {
            $remote = git rev-parse "@{u}"
            if ($local -eq $remote) {
                Write-Success "Branch is up to date with remote"
            } else {
                Write-Warning-Custom "Branch is not up to date with remote. Consider pulling changes."
            }
        } catch {
            # No upstream configured
        }

    } catch {
        Write-Error-Custom "Git checks failed: $_"
        Pop-Location
        return $false
    }

    Pop-Location
    return $true
}

# ═══════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════

# Determine what to run
$runBackend = -not $FrontendOnly
$runFrontend = -not $BackendOnly
$runDocker = $Docker
$runGit = -not $SkipGit

# Run checks
$failed = $false

if ($runGit) {
    $result = Check-Git
    if (-not $result) { $failed = $true }
}

if ($runBackend) {
    $result = Test-Backend
    if (-not $result) { $failed = $true }
}

if ($runFrontend) {
    $result = Test-Frontend
    if (-not $result) { $failed = $true }
}

if ($runDocker) {
    $result = Test-Docker
    if (-not $result) { $failed = $true }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
if (-not $failed) {
    Write-Host "✓ All checks passed! Ready to push." -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
    exit 0
} else {
    Write-Host "✗ Some checks failed. Please fix the issues." -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
    exit 1
}
