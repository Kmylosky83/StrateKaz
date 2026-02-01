# Quick Test Script - StrateKaz Core Endpoints
# PowerShell Script para testing rápido

$BASE_URL = "http://localhost:8000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STRATEKAZ v3.7.0 - QUICK ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "TEST 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/core/health/" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health check OK" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Health check FAILED: $_" -ForegroundColor Red
}

# Test 2: Branding (público, sin autenticación)
Write-Host "`nTEST 2: Branding Endpoint (Público)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/core/branding/active/" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Branding endpoint OK (200)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  Company: $($data.company_name)" -ForegroundColor Cyan
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "⚠ No branding config found (404) - Normal si no está configurado" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Branding FAILED: $_" -ForegroundColor Red
    }
}

# Test 3: User Preferences (requiere autenticación)
Write-Host "`nTEST 3: User Preferences (Requiere Token)" -ForegroundColor Yellow
Write-Host "Para testear este endpoint necesitas:" -ForegroundColor Cyan
Write-Host "1. Hacer login en http://localhost:3010/login" -ForegroundColor Cyan
Write-Host "2. Abrir DevTools → Application → Local Storage" -ForegroundColor Cyan
Write-Host "3. Copiar el valor de 'access_token'" -ForegroundColor Cyan
Write-Host "4. Ejecutar:" -ForegroundColor Cyan
Write-Host '   $token = "TU_TOKEN_AQUI"' -ForegroundColor White
Write-Host '   $headers = @{"Authorization" = "Bearer $token"}' -ForegroundColor White
Write-Host '   Invoke-WebRequest -Uri "http://localhost:8000/api/core/user-preferences/" -Headers $headers' -ForegroundColor White

# Test 4: Verificar servidores
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ESTADO DE SERVIDORES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Backend
Write-Host "Backend (Django):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/core/health/" -Method GET -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Backend corriendo en puerto 8000" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend NO responde en puerto 8000" -ForegroundColor Red
}

# Frontend
Write-Host "`nFrontend (Vite):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3010/" -Method GET -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Frontend corriendo en puerto 3010" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend NO responde en puerto 3010" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SIGUIENTE PASO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "1. Abre http://localhost:3010/login en el navegador" -ForegroundColor White
Write-Host "2. Haz login con tus credenciales" -ForegroundColor White
Write-Host "3. Ve a Perfil → Preferencias" -ForegroundColor White
Write-Host "4. Cambia el idioma y guarda" -ForegroundColor White
Write-Host "5. Recarga la página y verifica que persiste`n" -ForegroundColor White
