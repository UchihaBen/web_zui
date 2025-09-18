# Social Media Web Application

Ứng dụng mạng xã hội tương tự Facebook được xây dựng với React (Frontend), Python Flask (Backend) và MongoDB Atlas (Database).

## 🐳 Chạy nhanh với Docker (Khuyến nghị)

**Chỉ cần 2 bước:**
1. Khởi động Docker Desktop
2. Chạy: `docker-run.bat` (Windows) hoặc `./docker-run.sh` (Linux/Mac)
3. Mở trình duyệt: http://localhost:3000

👉 [Xem hướng dẫn Docker chi tiết](README-Docker.md)

## ✨ Tính năng

- 🔐 Đăng ký và đăng nhập người dùng
- 📝 Tạo và xem bài viết (hỗ trợ upload ảnh)
- 👍 Thích bài viết
- 🔍 Tìm kiếm người dùng
- 👥 Hệ thống kết bạn (gửi lời mời, chấp nhận)
- � Nhắn tin với bạn bè (hỗ trợ gửi ảnh)
- 📱 Giao diện responsive với navigation

## 🛠️ Công nghệ sử dụng

### Frontend
- React 18 với TypeScript
- React Router DOM
- Axios cho HTTP requests
- CSS3 với Flexbox/Grid

### Backend
- Python Flask
- Flask-JWT-Extended (Authentication)
- Flask-CORS
- PyMongo (MongoDB driver)

### Database
- MongoDB Atlas

## 📋 Yêu cầu hệ thống

- Node.js (v14 trở lên)
- Python (v3.8 trở lên)
- MongoDB Atlas account

## 🚀 Cài đặt và chạy dự án

### 1. Clone repository
```bash
git clone <repository-url>
cd web_Zui
```

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo (Windows)
venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ .env.example và cập nhật thông tin MongoDB
cp .env.example .env
```

### 3. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend (từ thư mục gốc)
cd frontend

# Cài đặt dependencies
npm install
```

## ▶️ Chạy ứng dụng

### Chạy Backend (Terminal 1)
```bash
cd backend
venv\Scripts\activate  # Kích hoạt môi trường ảo
python app.py
```
Backend sẽ chạy tại: http://localhost:5000

### Chạy Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Frontend sẽ chạy tại: http://localhost:3000

## 🗄️ Cấu hình Database

1. Tạo tài khoản MongoDB Atlas tại https://cloud.mongodb.com
2. Tạo cluster mới
3. Tạo database user
4. Cập nhật connection string trong file `.env`

## 📁 Cấu trúc dự án

```
web_Zui/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── App.tsx         # Main App component
│   ├── public/
│   └── package.json
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── venv/              # Virtual environment
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - Đăng ký người dùng mới
- `POST /api/login` - Đăng nhập

### Posts
- `GET /api/posts` - Lấy danh sách bài viết
- `POST /api/posts` - Tạo bài viết mới (hỗ trợ upload ảnh)
- `POST /api/posts/<id>/like` - Thích/bỏ thích bài viết

### Users & Friends
- `GET /api/search/users` - Tìm kiếm người dùng
- `POST /api/friends/request` - Gửi lời mời kết bạn
- `GET /api/friends/requests` - Lấy danh sách lời mời kết bạn
- `POST /api/friends/accept` - Chấp nhận lời mời kết bạn
- `GET /api/friends` - Lấy danh sách bạn bè

### Messages
- `POST /api/messages/send` - Gửi tin nhắn (hỗ trợ gửi ảnh)
- `GET /api/messages/<friend_id>` - Lấy tin nhắn với một bạn bè
- `GET /api/conversations` - Lấy danh sách cuộc trò chuyện

### Files
- `GET /uploads/<filename>` - Lấy file ảnh đã upload

## 🎨 Giao diện

- **Navigation Bar**: Menu điều hướng với Trang chủ, Bạn bè, Tin nhắn
- **Trang đăng nhập/đăng ký**: Form authentication với validation
- **Dashboard**: Hiển thị bài viết từ bạn bè và form tạo bài viết mới (hỗ trợ upload ảnh)
- **Trang Bạn bè**: Tìm kiếm, gửi lời mời, chấp nhận kết bạn
- **Trang Tin nhắn**: Chat real-time với bạn bè, hỗ trợ gửi ảnh
- **Post Card**: Hiển thị thông tin bài viết, tác giả, thời gian và tương tác

## 🔒 Bảo mật

- JWT tokens cho authentication
- Password hashing với Werkzeug
- CORS protection
- Environment variables cho thông tin nhạy cảm

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra connection string trong `.env`
- Đảm bảo IP address được whitelist trong MongoDB Atlas
- Kiểm tra username/password MongoDB

### Lỗi CORS
- Đảm bảo Flask-CORS đã được cài đặt và cấu hình
- Kiểm tra frontend đang gọi đúng URL backend

### Lỗi Dependencies
```bash
# Cập nhật pip
python -m pip install --upgrade pip

# Cài đặt lại dependencies
pip install -r requirements.txt
```

## 📝 Ghi chú

- Dự án này được tạo để học tập và demo
- Trong production, cần thêm các tính năng bảo mật khác
- Database schema có thể được tối ưu hóa thêm

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License.
