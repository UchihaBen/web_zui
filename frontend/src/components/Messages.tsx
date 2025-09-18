import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL, getImageUrl } from '../config/api';
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

  useEffect(() => {
    fetchConversations();
    // Get current user ID from token or context
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);
    }

    // Check if there's a friend ID in the URL to start conversation immediately
    const urlParams = new URLSearchParams(location.search);
    const friendId = urlParams.get('with');
    if (friendId) {
      console.log('Auto-starting conversation with friend from URL:', friendId);
      startConversationWithFriend(friendId);
    }
  }, []);

  useEffect(() => {
    // Only trigger on URL changes, not on component mount
    const urlParams = new URLSearchParams(location.search);
    const friendId = urlParams.get('with');
    if (friendId && selectedFriend && friendId !== selectedFriend.id) {
      console.log('URL changed - switching to conversation with:', friendId);
      startConversationWithFriend(friendId);
    }
  }, [location.search]); // Remove selectedFriend?.id dependency to avoid infinite loop

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Lỗi khi tải cuộc trò chuyện:', error);
    }
  };

  const selectConversation = async (friend: User) => {
    setSelectedFriend(friend);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/messages/${friend.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    console.log('Sending message to:', selectedFriend.id, 'Content:', newMessage);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await axios.post(`${API_BASE_URL}/messages`, {
        to_user_id: selectedFriend.id,
        content: newMessage
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Message sent successfully:', response.data);
      setNewMessage('');
      
      // Refresh messages
      const messagesResponse = await axios.get(`${API_BASE_URL}/messages/${selectedFriend.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMessages(messagesResponse.data);
      
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      console.error('Error details:', error?.response?.data);
      alert('Có lỗi xảy ra khi gửi tin nhắn: ' + (error?.response?.data?.error || error?.message || 'Unknown error'));
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
          const token = localStorage.getItem('token');
          await axios.post(`${API_BASE_URL}/messages`, {
            to_user_id: selectedFriend.id,
            content: '',
            image: reader.result
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          // Refresh messages
          const response = await axios.get(`${API_BASE_URL}/messages/${selectedFriend.id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  const navigateToProfile = (userId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/profile/${userId}`);
  };

  const startConversationWithFriend = async (friendId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users/${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const friend: User = {
        id: response.data.id,
        name: response.data.name,
        avatar: response.data.avatar
      };
      
      setSelectedFriend(friend);
      
      // Load existing messages if any
      try {
        const messagesResponse = await axios.get(`${API_BASE_URL}/messages/${friendId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMessages(messagesResponse.data);
        console.log('Loaded existing messages:', messagesResponse.data.length);
      } catch (error) {
        // No messages yet, start fresh
        console.log('No existing messages, starting fresh conversation');
        setMessages([]);
      }
      
    } catch (error) {
      console.error('Lỗi khi bắt đầu cuộc trò chuyện:', error);
      alert('Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const goBackToConversations = () => {
    setSelectedFriend(null);
    navigate('/messages');
  };

  // Check if we're in direct conversation mode (from URL parameter)
  const urlParams = new URLSearchParams(location.search);
  const isDirectConversation = false; // Always show sidebar, just auto-select friend

  return (
    <div className="messages-container">
      {/* Only show sidebar if not in direct conversation mode */}
      {!isDirectConversation && (
        <div className="messages-sidebar">
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
                    <img src={getImageUrl(conv.user.avatar)} alt={conv.user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4 
                      onClick={(e) => navigateToProfile(conv.user.id, e)}
                      className="user-name clickable"
                    >
                      {conv.user.name}
                    </h4>
                    <span className="conversation-time">
                      {formatRelativeTime(conv.last_message.created_at)}
                    </span>
                  </div>
                  <p className="last-message">
                    {conv.last_message.from_me ? 'Bạn: ' : ''}
                    {conv.last_message.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className={`messages-main ${isDirectConversation ? 'full-width' : ''}`}>
        {selectedFriend ? (
          <>
            <div className="messages-header">
              <div 
                className="user-avatar clickable"
                onClick={() => navigateToProfile(selectedFriend.id)}
                title={`Xem trang cá nhân của ${selectedFriend.name}`}
              >
                {selectedFriend.avatar ? (
                  <img src={getImageUrl(selectedFriend.avatar)} alt={selectedFriend.name} />
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
                        <div className="message-bubble">
                          {message.content && <p>{message.content}</p>}
                          {message.image_url && (
                            <img 
                              src={getImageUrl(message.image_url)} 
                              alt="Shared content" 
                              className="message-image"
                              onClick={() => window.open(getImageUrl(message.image_url), '_blank')}
                            />
                          )}
                          <span className="message-time">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
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
