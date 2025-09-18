@echo off
echo 📝 Web Zui Docker Logs

echo Choose which logs to view:
echo 1. All containers
echo 2. Frontend only  
echo 3. Backend only
echo 4. Nginx only

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo === All Container Logs ===
    docker-compose logs -f
) else if "%choice%"=="2" (
    echo === Frontend Logs ===
    docker-compose logs -f frontend
) else if "%choice%"=="3" (
    echo === Backend Logs ===
    docker-compose logs -f backend
) else if "%choice%"=="4" (
    echo === Nginx Logs ===
    docker-compose logs -f nginx
) else (
    echo Invalid choice. Showing all logs...
    docker-compose logs -f
)