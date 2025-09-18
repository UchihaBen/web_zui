import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, getImageUrl } from '../config/api';
import './Dashboard.css';

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
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
  comments: Comment[];
  reactions?: {
    like?: string[];
    love?: string[];
    laugh?: string[];
    angry?: string[];
    sad?: string[];
  };
  image_url?: string;
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Configure axios with auth token
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !selectedImage) return;

    setLoading(true);
    try {
      const postData: any = {
        content: newPost
      };

      if (selectedImage) {
        postData.image = selectedImage;
      }

      await axios.post(`${API_BASE_URL}/posts`, postData);
      
      setNewPost('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi đăng bài:', error);
      alert('Có lỗi xảy ra khi đăng bài');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi like bài viết:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await axios.delete(`${API_BASE_URL}/posts/${postId}`);
        fetchPosts();
      } catch (error) {
        console.error('Lỗi khi xóa bài viết:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      await axios.post(`${API_BASE_URL}/posts/${postId}/reactions`, {
        reaction_type: reactionType
      });
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi phản ứng:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      await axios.post(`${API_BASE_URL}/posts/${postId}/comments`, {
        content: commentText
      });
      
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchPosts(); // Refresh posts to update comments
    } catch (error) {
      console.error('Lỗi khi bình luận:', error);
      alert('Có lỗi xảy ra khi bình luận');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const navigateToProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="dashboard">
      <main className="dashboard-main">
        <div className="content-container">
          {/* Create Post Section */}
          <div className="create-post-card">
            <h2>Bạn đang nghĩ gì?</h2>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Chia sẻ suy nghĩ của bạn..."
                className="post-textarea"
                rows={3}
              />
              
              {selectedImage && (
                <div className="image-preview">
                  <img src={selectedImage} alt="Preview" />
                  <button type="button" onClick={removeSelectedImage} className="remove-image-btn">
                    ✕
                  </button>
                </div>
              )}

              <div className="post-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="image-btn"
                  disabled={loading}
                >
                  📷 Thêm ảnh
                </button>
                <button type="submit" disabled={loading || (!newPost.trim() && !selectedImage)}>
                  {loading ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="posts-feed">
            {posts.length === 0 ? (
              <div className="no-posts">
                <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <div 
                        className="user-avatar clickable"
                        onClick={() => navigateToProfile(post.author.id)}
                        title={`Xem trang cá nhân của ${post.author.name}`}
                      >
                        {post.author.avatar ? (
                          <img src={getImageUrl(post.author.avatar)} alt={post.author.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {post.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="author-info">
                        <h3 
                          onClick={() => navigateToProfile(post.author.id)}
                          className="author-name clickable"
                        >
                          {post.author.name}
                        </h3>
                        <span className="post-time">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    {/* Delete button for post author */}
                    {user?.id === post.author.id && (
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
                  
                  {/* Reactions */}
                  <div className="post-reactions">
                    {/* Display reaction counts */}
                    {(post.reactions && Object.values(post.reactions).some((arr: any) => arr?.length > 0)) && (
                      <div className="reactions-display">
                        {(post.reactions.like && post.reactions.like.length > 0) && (
                          <span className="reaction-count">👍 {post.reactions.like.length}</span>
                        )}
                        {(post.reactions.love && post.reactions.love.length > 0) && (
                          <span className="reaction-count">❤️ {post.reactions.love.length}</span>
                        )}
                        {(post.reactions.laugh && post.reactions.laugh.length > 0) && (
                          <span className="reaction-count">😄 {post.reactions.laugh.length}</span>
                        )}
                        {(post.reactions.angry && post.reactions.angry.length > 0) && (
                          <span className="reaction-count">😠 {post.reactions.angry.length}</span>
                        )}
                        {(post.reactions.sad && post.reactions.sad.length > 0) && (
                          <span className="reaction-count">😢 {post.reactions.sad.length}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="reaction-buttons">
                      <button 
                        onClick={() => handleReaction(post.id, 'like')}
                        className={`reaction-btn ${post.reactions?.like?.includes(user?.id || '') ? 'active' : ''}`}
                        data-reaction="like"
                        title="Thích"
                      >
                        Thích
                      </button>
                      <button 
                        onClick={() => handleReaction(post.id, 'love')}
                        className={`reaction-btn ${post.reactions?.love?.includes(user?.id || '') ? 'active' : ''}`}
                        data-reaction="love"
                        title="Yêu thích"
                      >
                        Yêu thích
                      </button>
                      <button 
                        onClick={() => handleReaction(post.id, 'laugh')}
                        className={`reaction-btn ${post.reactions?.laugh?.includes(user?.id || '') ? 'active' : ''}`}
                        data-reaction="haha"
                        title="Haha"
                      >
                        Haha
                      </button>
                      <button 
                        onClick={() => handleReaction(post.id, 'angry')}
                        className={`reaction-btn ${post.reactions?.angry?.includes(user?.id || '') ? 'active' : ''}`}
                        data-reaction="angry"
                        title="Giận"
                      >
                        Giận
                      </button>
                      <button 
                        onClick={() => handleReaction(post.id, 'sad')}
                        className={`reaction-btn ${post.reactions?.sad?.includes(user?.id || '') ? 'active' : ''}`}
                        data-reaction="sad"
                        title="Buồn"
                      >
                        Buồn
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  <div className="comments-section">
                    <div className="comments-list">
                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="comment">
                          <div 
                            className="comment-avatar clickable"
                            onClick={() => navigateToProfile(comment.author_id)}
                            title={`Xem trang cá nhân của ${comment.author_name}`}
                          >
                            {comment.author_avatar ? (
                              <img src={getImageUrl(comment.author_avatar)} alt={comment.author_name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {comment.author_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="comment-content">
                            <div className="comment-bubble">
                              <strong 
                                onClick={() => navigateToProfile(comment.author_id)}
                                className="comment-author-name clickable"
                              >
                                {comment.author_name}
                              </strong>
                              <p>{comment.content}</p>
                            </div>
                            <span className="comment-time">{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="add-comment-form">
                      <div 
                        className="user-avatar clickable"
                        onClick={() => navigateToProfile(user?.id || '')}
                        title={`Xem trang cá nhân của bạn`}
                      >
                        {user?.avatar ? (
                          <img src={getImageUrl(user.avatar)} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <textarea
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Viết bình luận..."
                        className="comment-input"
                        rows={1}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handleAddComment(post.id)}
                        className="send-comment-btn"
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
