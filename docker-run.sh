#!/bin/bash

echo "🚀 Starting Web Zui Docker containers..."

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "💡 Please start Docker first:"
    echo "   sudo systemctl start docker"
    echo "   # Or install Docker if not installed:"
    echo "   sudo apt install docker.io docker-compose -y"
    echo "   sudo usermod -aG docker \$USER"
    echo "   # Then logout and login again"
    exit 1
fi

echo "✅ Docker is running!"

# Stop existing containers if running
echo "⏹️  Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait a moment for containers to start
echo "⏰ Waiting for containers to start..."
sleep 10

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo ""
echo "✅ Application is ready!"
echo "🌐 Open your browser and go to: http://localhost:3000"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "📝 To stop app: docker-compose down"
echo ""
