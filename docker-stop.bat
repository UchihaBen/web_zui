@echo off
echo 🛑 Stopping Web Zui Docker containers...

docker-compose down

echo ✅ All containers stopped!
echo 💡 To start again, run: docker-run.bat
pause