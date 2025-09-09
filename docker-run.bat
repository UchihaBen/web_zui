@echo off
echo 🚀 Building Web Zui Docker containers...

rem Stop existing containers if running
echo ⏹️  Stopping existing containers...
docker-compose down

rem Build and start containers
echo 🔨 Building and starting containers...
docker-compose up --build -d

rem Show running containers
echo 📋 Running containers:
docker-compose ps

rem Show logs
echo 📝 Container logs:
echo Backend logs:
docker-compose logs backend --tail=20

echo Frontend logs:
docker-compose logs frontend --tail=20

echo MongoDB logs:
docker-compose logs mongo --tail=10

echo.
echo 🎉 Web Zui is now running!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo MongoDB: localhost:27017
echo.
echo To stop containers: docker-compose down
echo To view logs: docker-compose logs -f [service_name]

pause
