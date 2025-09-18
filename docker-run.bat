@echo off
echo 🚀 Starting Web Zui Docker containers...

rem Check if Docker is running
echo 🔍 Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running!
    echo 💡 Please start Docker Desktop first, then run this script again.
    echo 📖 How to start Docker Desktop:
    echo    1. Open Docker Desktop application
    echo    2. Wait for it to fully start
    echo    3. Run this script again
    pause
    exit /b 1
)

echo ✅ Docker is running!

rem Stop existing containers if running
echo ⏹️  Stopping existing containers...
docker-compose down

rem Build and start containers
echo 🔨 Building and starting containers...
docker-compose up --build -d

rem Wait a moment for containers to start
echo ⏰ Waiting for containers to start...
timeout /t 10 /nobreak >nul

rem Show running containers
echo 📋 Running containers:
docker-compose ps

echo.
echo ✅ Application is ready!
echo 🌐 Open your browser and go to: http://localhost:3000
echo.
echo 📝 To view logs: docker-compose logs -f
echo 📝 To stop app: docker-compose down
echo.
pause

echo Frontend logs:
docker-compose logs frontend --tail=20

echo ✅ Deployment complete!
echo 🌐 Access your app at: http://localhost:3000
echo 📡 API calls automatically proxy through port 3000
echo 🔧 Only port 3000 is exposed - backend is internal only

echo.
echo Press any key to continue...
pause

echo.
echo 🎉 Web Zui is now running!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo MongoDB: localhost:27017
echo.
echo To stop containers: docker-compose down
echo To view logs: docker-compose logs -f [service_name]

pause
