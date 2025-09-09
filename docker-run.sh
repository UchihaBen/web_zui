#!/bin/bash

# Docker build and run script

echo "🚀 Building Web Zui Docker containers..."

# Stop existing containers if running
echo "⏹️  Stopping existing containers..."
docker-compose down

# Remove old images (optional - uncomment if you want to rebuild from scratch)
# docker-compose build --no-cache

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Show running containers
echo "📋 Running containers:"
docker-compose ps

# Show logs
echo "📝 Container logs:"
echo "Backend logs:"
docker-compose logs backend --tail=20

echo "Frontend logs:"
docker-compose logs frontend --tail=20

echo "MongoDB logs:"
docker-compose logs mongo --tail=10

echo ""
echo "🎉 Web Zui is now running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "MongoDB: localhost:27017"
echo ""
echo "To stop containers: docker-compose down"
echo "To view logs: docker-compose logs -f [service_name]"
