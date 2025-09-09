# Web Zui - Docker Setup

## Yêu cầu hệ thống

- Docker Engine 20.10+
- Docker Compose 1.29+
- RAM: tối thiểu 2GB trống
- Ổ cứng: tối thiểu 1GB trống

## Cấu trúc Docker

- **Frontend**: React app với Nginx (Port 3000)
- **Backend**: Flask API (Port 5000) 
- **Database**: MongoDB (Port 27017)

## Cách chạy

### 1. Sử dụng script tự động

**Windows:**
```bash
docker-run.bat
```

**Linux/Mac:**
```bash
chmod +x docker-run.sh
./docker-run.sh
```

### 2. Chạy thủ công

```bash
# Build và chạy tất cả containers
docker-compose up --build -d

# Xem logs
docker-compose logs -f

# Dừng containers
docker-compose down
```

## Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## Quản lý containers

```bash
# Xem trạng thái containers
docker-compose ps

# Xem logs của service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo

# Restart service
docker-compose restart backend

# Xóa tất cả (bao gồm volumes)
docker-compose down -v
```

## Environment Variables

Có thể tùy chỉnh trong file `.env.docker`:

```env
FLASK_ENV=production
MONGODB_URI=mongodb://mongo:27017/web_zui
JWT_SECRET_KEY=your-secret-key
```

## Volumes

- `mongo_data`: Lưu trữ dữ liệu MongoDB
- `./backend/uploads`: Lưu trữ files upload

## Production Deployment

### 1. Cập nhật environment variables
```bash
cp .env.docker .env
# Sửa JWT_SECRET_KEY và các thông số khác
```

### 2. Sử dụng external MongoDB (tuỳ chọn)
```yaml
# Trong docker-compose.yml, comment phần mongo service
# và update MONGODB_URI trong backend environment
```

### 3. SSL/HTTPS
Thêm reverse proxy như Nginx hoặc Traefik để handle SSL.

## Troubleshooting

### Container không start
```bash
# Xem logs chi tiết
docker-compose logs backend
docker-compose logs frontend

# Rebuild container
docker-compose build --no-cache backend
```

### Database connection failed
```bash
# Kiểm tra MongoDB container
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### Port conflicts
Nếu port 3000 hoặc 5000 đã được sử dụng, sửa trong `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Thay đổi port 3000 thành 3001
```

## Development Mode

Để chạy trong development mode với hot reload:

```bash
# Chỉ chạy database
docker-compose up mongo -d

# Chạy backend và frontend locally
cd backend && python app.py
cd frontend && npm start
```
