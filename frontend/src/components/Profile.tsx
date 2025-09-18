import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, getImageUrl } from '../config/api';
import './Profile.css';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  created_at: string;
  friends: string[];
}

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
  likes: string[];
  comments: any[];
  reactions?: {
    like?: string[];
    love?: string[];
    laugh?: string[];
    angry?: string[];
    sad?: string[];
  };
  image_url?: string;
}

function Profile() {
  const { user, updateUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    avatar: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isOwnProfile = !userId || userId === user?.id;

  // Configure axios with auth token
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const response = await axios.get(`${API_BASE_URL}/users/${targetUserId}`);
      setProfile(response.data);
      
      if (!isOwnProfile) {
        checkFriendshipStatus(targetUserId);
      }
      
      setEditData({
        name: response.data.name,
        bio: response.data.bio || '',
        avatar: response.data.avatar || ''
      });
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const response = await axios.get(`${API_BASE_URL}/users/${targetUserId}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async (targetUserId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/friends/status/${targetUserId}`);
      setIsFriend(response.data.isFriend);
      setFriendRequestSent(response.data.requestSent);
    } catch (error) {
      console.error('Lỗi khi kiểm tra tình trạng bạn bè:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setEditData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updateData: any = {
        name: editData.name,
        bio: editData.bio
      };

      if (selectedImage) {
        updateData.avatar = selectedImage;
      }

      const response = await axios.put(`${API_BASE_URL}/users/profile`, updateData);
      
      setProfile(response.data.user);
      updateUser(response.data.user);
      setIsEditing(false);
      setSelectedImage(null);
      
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await axios.post(`${API_BASE_URL}/friends/request`, {
        to_user_id: userId
      });
      setFriendRequestSent(true);
      alert('Đã gửi lời mời kết bạn!');
    } catch (error) {
      console.error('Lỗi khi gửi lời mời kết bạn:', error);
      alert('Có lỗi xảy ra khi gửi lời mời kết bạn');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await axios.delete(`${API_BASE_URL}/posts/${postId}`);
        setPosts(posts.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Lỗi khi xóa bài viết:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!profile) {
    return <div className="error">Không tìm thấy người dùng</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {(selectedImage || profile.avatar) ? (
                <img src={selectedImage || getImageUrl(profile.avatar)} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && isEditing && (
              <button 
                className="change-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>
            )}
          </div>
        </div>
        
        <div className="profile-info">
          {isEditing ? (
            <div className="edit-profile-form">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tên của bạn"
                className="edit-input"
              />
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Giới thiệu về bạn..."
                className="edit-textarea"
                rows={3}
              />
              <div className="edit-buttons">
                <button onClick={handleUpdateProfile} className="save-btn">
                  Lưu
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  setSelectedImage(null);
                  setEditData({
                    name: profile.name,
                    bio: profile.bio || '',
                    avatar: profile.avatar || ''
                  });
                }} className="cancel-btn">
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <h1>{profile.name}</h1>
              <p className="profile-bio">{profile.bio || 'Chưa có giới thiệu'}</p>
              <p className="profile-stats">
                <span>{posts.length} bài viết</span>
                <span>{profile.friends?.length || 0} bạn bè</span>
              </p>
              <p className="join-date">
                Tham gia vào {formatDate(profile.created_at)}
              </p>
              
              <div className="profile-actions">
                {isOwnProfile ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="edit-profile-btn"
                  >
                    Chỉnh sửa thông tin
                  </button>
                ) : (
                  <div className="friend-actions">
                    {isFriend ? (
                      <>
                        <button className="friend-btn">Bạn bè ✓</button>
                        <button 
                          onClick={() => navigate(`/messages?with=${userId || profile.id}`)}
                          className="message-btn"
                        >
                          Nhắn tin
                        </button>
                      </>
                    ) : friendRequestSent ? (
                      <button className="request-sent-btn">Đã gửi lời mời</button>
                    ) : (
                      <button 
                        onClick={handleSendFriendRequest}
                        className="add-friend-btn"
                      >
                        Kết bạn
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Posts Section */}
      <div className="profile-posts">
        <h2>{isOwnProfile ? 'Bài viết của bạn' : `Bài viết của ${profile.name}`}</h2>
        
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>{isOwnProfile ? 'Bạn chưa có bài viết nào' : 'Người này chưa có bài viết nào'}</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-author">
                    <div className="user-avatar">
                      {post.author.avatar ? (
                        <img src={getImageUrl(post.author.avatar)} alt={post.author.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {post.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="author-info">
                      <h3>{post.author.name}</h3>
                      <span className="post-time">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="delete-post-btn"
                      title="Xóa bài viết"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.image_url && (
                    <img src={getImageUrl(post.image_url)} alt="Post image" className="post-image" />
                  )}
                </div>
                
                <div className="post-stats">
                  <span>{post.likes?.length || 0} lượt thích</span>
                  <span>{post.comments?.length || 0} bình luận</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
