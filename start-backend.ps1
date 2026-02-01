# Start Backend Server - StrateKaz
Write-Host "Starting StrateKaz Backend..." -ForegroundColor Cyan

Set-Location -Path "C:\Proyectos\StrateKaz\backend"

# Activar entorno virtual y ejecutar servidor
& .\venv\Scripts\python.exe manage.py runserver
