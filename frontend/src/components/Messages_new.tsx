import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Messages.css';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  content: string;
  image_url?: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  user: User;
  last_message: {
    content: string;
    created_at: string;
    from_me: boolean;
  };
}

function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const API_BASE_URL = '/api';

  useEffect(() => {
    fetchConversations();
    // Get current user ID from token or context
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-select friend if coming from URL parameter
    const urlParams = new URLSearchParams(location.search);
    const friendId = urlParams.get('friend');
    if (friendId && conversations.length > 0) {
      const friend = conversations.find(conv => conv.user.id === friendId);
      if (friend) {
        selectConversation(friend.user);
      }
    }
  }, [conversations, location]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Lỗi khi tải cuộc trò chuyện:', error);
    }
  };

  const selectConversation = async (friend: User) => {
    setSelectedFriend(friend);
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/${friend.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/messages`, {
        to_user_id: selectedFriend.id,
        content: newMessage
      });

      setNewMessage('');
      // Refresh messages
      const response = await axios.get(`${API_BASE_URL}/messages/${selectedFriend.id}`);
      setMessages(response.data);
      
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await axios.post(`${API_BASE_URL}/messages`, {
            to_user_id: selectedFriend.id,
            content: '',
            image: reader.result
          });

          // Refresh messages
          const response = await axios.get(`${API_BASE_URL}/messages/${selectedFriend.id}`);
          setMessages(response.data);
          
          // Refresh conversations
          fetchConversations();
        } catch (error) {
          console.error('Lỗi khi gửi ảnh:', error);
          alert('Có lỗi xảy ra khi gửi ảnh');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLoading(false);
      console.error('Lỗi khi xử lý ảnh:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const navigateToProfile = (userId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="messages-container">
      <div className="conversations-sidebar">
        <h3>Tin nhắn</h3>
        {conversations.length === 0 ? (
          <p className="no-conversations">Chưa có cuộc trò chuyện nào</p>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.user.id}
              className={`conversation-item ${selectedFriend?.id === conv.user.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.user)}
            >
              <div 
                className="user-avatar clickable"
                onClick={(e) => navigateToProfile(conv.user.id, e)}
                title={`Xem trang cá nhân của ${conv.user.name}`}
              >
                {conv.user.avatar ? (
                  <img src={conv.user.avatar} alt={conv.user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {conv.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="conversation-info">
                <h4 
                  onClick={(e) => navigateToProfile(conv.user.id, e)}
                  className="user-name clickable"
                >
                  {conv.user.name}
                </h4>
                <p className="last-message">
                  {conv.last_message.from_me ? 'Bạn: ' : ''}
                  {conv.last_message.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="messages-main">
        {selectedFriend ? (
          <>
            <div className="messages-header">
              <div 
                className="user-avatar clickable"
                onClick={() => navigateToProfile(selectedFriend.id)}
                title={`Xem trang cá nhân của ${selectedFriend.name}`}
              >
                {selectedFriend.avatar ? (
                  <img src={selectedFriend.avatar} alt={selectedFriend.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedFriend.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 
                onClick={() => navigateToProfile(selectedFriend.id)}
                className="user-name clickable"
              >
                {selectedFriend.name}
              </h3>
            </div>

            <div className="messages-content">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="date-separator">
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                      )}
                      <div className={`message ${message.from_user === currentUserId ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          {message.content && <p>{message.content}</p>}
                          {message.image_url && (
                            <img 
                              src={message.image_url} 
                              alt="Shared image" 
                              className="message-image"
                              onClick={() => window.open(message.image_url, '_blank')}
                            />
                          )}
                        </div>
                        <span className="message-time">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="attachment-btn"
                disabled={loading}
              >
                📎
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="message-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={loading}
              />
              <button 
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                className="send-btn"
              >
                {loading ? '...' : 'Gửi'}
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <p>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
