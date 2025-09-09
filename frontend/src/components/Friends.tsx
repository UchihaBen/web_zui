import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './Friends.css';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface FriendRequest {
  id: string;
  from_user: User;
  created_at: string;
}

function Friends() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends`);
      setFriends(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends/requests`);
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Lỗi khi tải lời mời kết bạn:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search/users?q=${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/friends/request`, {
        friend_id: friendId
      });
      alert('Đã gửi lời mời kết bạn!');
      // Remove from search results
      setSearchResults(searchResults.filter(user => user.id !== friendId));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/friends/accept`, {
        request_id: requestId
      });
      alert('Đã chấp nhận lời mời kết bạn!');
      fetchFriends();
      fetchFriendRequests();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers();
  };

  const goToMessages = (friendId: string) => {
    navigate(`/messages?with=${friendId}`);
  };

  return (
    <div className="friends-container">
      <h2>Bạn bè</h2>

      {/* Tìm bạn mới chưa kết bạn */}
      <div className="search-section">
        <h3>Tìm bạn mới</h3>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập tên hoặc email để tìm bạn mới..."
            className="search-input"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div 
                    className="user-avatar clickable"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    title={`Xem trang cá nhân của ${user.name}`}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => sendFriendRequest(user.id)}
                  className="add-friend-btn"
                >
                  Gửi lời mời kết bạn
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lời mời kết bạn */}
      {friendRequests.length > 0 && (
        <div className="friend-requests">
          <h3>Lời mời kết bạn ({friendRequests.length})</h3>
          {friendRequests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="user-info">
                <div 
                  className="user-avatar clickable"
                  onClick={() => navigate(`/profile/${request.from_user.id}`)}
                  title={`Xem trang cá nhân của ${request.from_user.name}`}
                >
                  {request.from_user.avatar ? (
                    <img src={request.from_user.avatar} alt={request.from_user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {request.from_user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4>{request.from_user.name}</h4>
                  <p>Đã gửi lời mời kết bạn</p>
                </div>
              </div>
              <button 
                onClick={() => acceptFriendRequest(request.id)}
                className="accept-btn"
              >
                Chấp nhận
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Danh sách bạn bè đã kết bạn */}
      <div className="friends-list">
        <h3>Danh sách bạn bè ({friends.length})</h3>
        <form className="search-form" style={{marginBottom: '10px'}}>
          <input
            type="text"
            placeholder="Tìm bạn trong danh sách bạn bè..."
            className="search-input"
            onChange={(e) => {
              const value = e.target.value.toLowerCase();
              setFriends(prev => prev.filter(f => f.name.toLowerCase().includes(value) || f.email.toLowerCase().includes(value)));
            }}
          />
        </form>
        {friends.length === 0 ? (
          <p>Chưa có bạn bè nào. Hãy tìm kiếm và kết bạn!</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <div className="user-info">
                <div 
                  className="user-avatar clickable"
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  title={`Xem trang cá nhân của ${friend.name}`}
                >
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="user-name clickable"
                  >
                    {friend.name}
                  </h4>
                  <p>{friend.email}</p>
                </div>
              </div>
              <button 
                className="message-btn"
                onClick={() => goToMessages(friend.id)}
              >
                Nhắn tin
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Friends;
