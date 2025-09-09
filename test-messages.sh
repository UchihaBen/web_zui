#!/bin/bash

echo "🧪 Testing Messages functionality..."

# Test conversation API
echo "📡 Testing conversations API..."
curl -X GET "http://localhost:5000/api/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Test completed. Check the response above."
echo ""
echo "📋 Manual test steps:"
echo "1. Đăng nhập vào ứng dụng"
echo "2. Kết bạn với ai đó"
echo "3. Vào trang profile của bạn bè"
echo "4. Click nút 'Nhắn tin'"
echo "5. Kiểm tra xem có hiển thị form chat không"
echo ""
echo "🎯 Expected behavior:"
echo "- Danh sách conversations sẽ hiển thị tất cả bạn bè (kể cả chưa chat)"
echo "- Khi click 'Nhắn tin' từ profile sẽ tự động mở conversation"
echo "- Có thể gửi tin nhắn ngay lập tức"
