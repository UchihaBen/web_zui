## 🐛 Debug Messages Issue

Để test và fix lỗi Messages, hãy làm theo các bước sau:

### 1. **Mở Developer Console**
- Trên browser, nhấn F12 → Console tab
- Reload trang Messages

### 2. **Test Flow:**

#### 🔐 **Bước 1: Đăng nhập**
```
1. Truy cập: http://localhost:3000/login
2. Đăng nhập với tài khoản có sẵn
3. Kiểm tra console có error gì không
```

#### 👥 **Bước 2: Kiểm tra bạn bè**
```
1. Vào /friends
2. Kết bạn với ai đó (nếu chưa có)
3. Kiểm tra danh sách bạn bè
```

#### 💬 **Bước 3: Test Messages**
```
1. Vào trang Profile của bạn bè
2. Click nút "Nhắn tin"
3. Xem console có log gì:
   - "Sending message to: [user_id]"
   - "Token exists: true/false"
   - "Message sent successfully" or error
```

#### 🔍 **Bước 4: Debug trực tiếp**
```
// Test API trực tiếp trong console:
const token = localStorage.getItem('token');
console.log('Token:', token);

// Test conversations API
fetch('http://localhost:5000/api/conversations', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Conversations:', data));

// Test send message API
fetch('http://localhost:5000/api/messages', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}` 
  },
  body: JSON.stringify({
    to_user_id: 'USER_ID_HERE',
    content: 'Test message'
  })
})
.then(r => r.json())
.then(data => console.log('Send result:', data));
```

### 3. **Các lỗi thường gặp:**

❌ **"Unauthorized"** → Token hết hạn, cần đăng nhập lại
❌ **"User not found"** → User ID không tồn tại  
❌ **"Not friends"** → Chưa kết bạn
❌ **Network Error** → Backend không chạy

### 4. **Expected Behavior:**

✅ **Khi vào /messages:**
- Hiển thị danh sách tất cả bạn bè
- Bạn bè chưa chat hiển thị "Chưa có tin nhắn nào"

✅ **Khi click "Nhắn tin" từ Profile:**
- Chuyển đến /messages?with=userId
- Tự động chọn người đó trong danh sách
- Hiển thị form chat ready

✅ **Khi gửi tin nhắn:**
- Tin nhắn hiển thị ngay lập tức
- Cập nhật last message trong sidebar
- Scroll xuống cuối automatically

### 5. **Quick Fix Commands:**

```bash
# Restart local servers nếu cần
cd backend && python app.py
cd frontend && npm start

# Check Docker status
docker-compose ps
docker-compose logs backend
```
