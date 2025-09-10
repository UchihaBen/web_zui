#!/bin/bash

echo "🚀 Starting deployment..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build new images
echo "🏗️  Building new images..."
docker-compose build

# Start containers
echo "▶️  Starting containers..."
docker-compose up -d

# Check status
echo "📊 Checking container status..."
docker-compose ps

# Show logs
echo "📝 Recent logs:"
docker-compose logs --tail=10

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://YOUR_SERVER_IP:3000"
echo "📡 Only port 3000 needs to be open in firewall"
