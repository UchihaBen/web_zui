#!/bin/bash

echo "📝 Web Zui Docker Logs"
echo ""
echo "Choose which logs to view:"
echo "1. All containers"
echo "2. Frontend only"
echo "3. Backend only"
echo "4. Nginx only"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "=== All Container Logs ==="
        docker-compose logs -f
        ;;
    2)
        echo "=== Frontend Logs ==="
        docker-compose logs -f frontend
        ;;
    3)
        echo "=== Backend Logs ==="
        docker-compose logs -f backend
        ;;
    4)
        echo "=== Nginx Logs ==="
        docker-compose logs -f nginx
        ;;
    *)
        echo "Invalid choice. Showing all logs..."
        docker-compose logs -f
        ;;
esac