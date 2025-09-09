from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
from bson import ObjectId
import json
from dotenv import load_dotenv
import base64
import uuid

# Load environment variables
load_dotenv()

# Upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

jwt = JWTManager(app)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI', "mongodb+srv://admin:Thanh01042003%40@cluster0.gl6b566.mongodb.net/social_app?retryWrites=true&w=majority&appName=Cluster0")
client = MongoClient(MONGO_URI)

# Database name from environment or default
DB_NAME = os.getenv('DB_NAME', 'social_app')
db = client[DB_NAME]

# Collections
users_collection = db.users
posts_collection = db.posts
friends_collection = db.friends
messages_collection = db.messages

# Helper functions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_base64_image(base64_string):
    try:
        # Remove data:image/jpeg;base64, prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        image_data = base64.b64decode(base64_string)
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        return f"/uploads/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

# Custom JSON encoder for ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Email, password và name là bắt buộc'}), 400
        
        # Kiểm tra email đã tồn tại
        if users_collection.find_one({'email': data['email']}):
            return jsonify({'error': 'Email đã được sử dụng'}), 400
        
        # Tạo user mới
        hashed_password = generate_password_hash(data['password'])
        user = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password,
            'created_at': datetime.utcnow(),
            'avatar': data.get('avatar', ''),
            'bio': data.get('bio', ''),
            'friends': []
        }
        
        result = users_collection.insert_one(user)
        
        # Tạo access token
        access_token = create_access_token(identity=str(result.inserted_id))
        
        return jsonify({
            'message': 'Đăng ký thành công',
            'access_token': access_token,
            'user': {
                'id': str(result.inserted_id),
                'name': user['name'],
                'email': user['email'],
                'avatar': user['avatar'],
                'bio': user['bio']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email và password là bắt buộc'}), 400
        
        # Tìm user
        user = users_collection.find_one({'email': data['email']})
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Email hoặc password không đúng'}), 401
        
        # Tạo access token
        access_token = create_access_token(identity=str(user['_id']))
        
        return jsonify({
            'message': 'Đăng nhập thành công',
            'access_token': access_token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'avatar': user.get('avatar', ''),
                'bio': user.get('bio', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['GET'])
@jwt_required()
def get_posts():
    try:
        user_id = get_jwt_identity()
        print(f"Getting posts for user: {user_id}")
        
        # Lấy danh sách bạn bè
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        friends_list = user.get('friends', [])
        friends_list.append(ObjectId(user_id))  # Bao gồm cả bài viết của chính mình
        print(f"Friends list: {friends_list}")
        
        # Lấy bài viết từ bạn bè và chính mình
        posts = list(posts_collection.find({
            'author_id': {'$in': friends_list}
        }).sort('created_at', -1))
        print(f"Found {len(posts)} posts")
        
        # Populate thông tin author
        for post in posts:
            author = users_collection.find_one({'_id': post['author_id']})
            if not author:
                print(f"Author not found for post {post['_id']}")
                continue
                
            post['author'] = {
                'id': str(author['_id']),
                'name': author['name'],
                'avatar': author.get('avatar', '')
            }
            post['id'] = str(post['_id'])
            
            # Convert datetime to string
            if 'created_at' in post:
                post['created_at'] = post['created_at'].isoformat()
            
            # Convert ObjectId lists to string lists
            if 'likes' in post:
                post['likes'] = [str(like_id) for like_id in post['likes']]
            
            # Convert reactions ObjectIds to strings
            if 'reactions' in post:
                for reaction_type, user_ids in post['reactions'].items():
                    post['reactions'][reaction_type] = [str(uid) for uid in user_ids]
            else:
                # Add default reactions for old posts
                post['reactions'] = {
                    'like': [],
                    'love': [],
                    'laugh': [],
                    'angry': [],
                    'sad': []
                }
            
            # Convert comments ObjectIds to strings and datetime
            if 'comments' in post:
                for comment in post['comments']:
                    if '_id' in comment:
                        comment['id'] = str(comment['_id'])
                        del comment['_id']
                    if 'author_id' in comment:
                        comment['author_id'] = str(comment['author_id'])
                    if 'created_at' in comment:
                        comment['created_at'] = comment['created_at'].isoformat()
                        
            # Update image URL to include full path
            if post.get('image_url'):
                post['image_url'] = f"http://localhost:5000{post['image_url']}"
                
            del post['_id']
            del post['author_id']
        
        return jsonify(posts), 200
        
    except Exception as e:
        print(f"Error in get_posts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Nội dung bài viết là bắt buộc'}), 400
        
        # Handle image upload
        image_url = ''
        if data.get('image'):
            image_url = save_base64_image(data['image'])
            if not image_url:
                return jsonify({'error': 'Lỗi khi upload ảnh'}), 400
        
        post = {
            'content': data['content'],
            'author_id': ObjectId(user_id),
            'created_at': datetime.utcnow(),
            'likes': [],
            'comments': [],
            'reactions': {
                'like': [],
                'love': [],
                'laugh': [],
                'angry': [],
                'sad': []
            },
            'image_url': image_url
        }
        
        result = posts_collection.insert_one(post)
        
        # Lấy thông tin author
        author = users_collection.find_one({'_id': ObjectId(user_id)})
        
        return jsonify({
            'message': 'Đăng bài thành công',
            'post': {
                'id': str(result.inserted_id),
                'content': post['content'],
                'created_at': post['created_at'].isoformat(),
                'likes': [],
                'comments': [],
                'reactions': {
                    'like': [],
                    'love': [],
                    'laugh': [],
                    'angry': [],
                    'sad': []
                },
                'image_url': f"http://localhost:5000{image_url}" if image_url else '',
                'author': {
                    'id': str(author['_id']),
                    'name': author['name'],
                    'avatar': author.get('avatar', '')
                }
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        user_object_id = ObjectId(user_id)
        
        if user_object_id in post.get('likes', []):
            # Unlike
            posts_collection.update_one(
                {'_id': ObjectId(post_id)},
                {'$pull': {'likes': user_object_id}}
            )
            message = 'Đã bỏ thích'
        else:
            # Like
            posts_collection.update_one(
                {'_id': ObjectId(post_id)},
                {'$addToSet': {'likes': user_object_id}}
            )
            message = 'Đã thích'
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    try:
        user_id = get_jwt_identity()
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        # Chỉ cho phép tác giả xóa bài viết
        if str(post['author_id']) != user_id:
            return jsonify({'error': 'Bạn không có quyền xóa bài viết này'}), 403
        
        # Xóa file ảnh nếu có
        if post.get('image_url'):
            import os
            image_path = f"uploads{post['image_url']}"
            if os.path.exists(image_path):
                os.remove(image_path)
        
        posts_collection.delete_one({'_id': ObjectId(post_id)})
        return jsonify({'message': 'Đã xóa bài viết'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>/comment', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Nội dung bình luận là bắt buộc'}), 400
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        comment = {
            '_id': ObjectId(),
            'author_id': ObjectId(user_id),
            'author_name': user['name'],
            'author_avatar': user.get('avatar', ''),
            'content': data['content'],
            'created_at': datetime.utcnow()
        }
        
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$push': {'comments': comment}}
        )
        
        # Convert for response
        comment['id'] = str(comment['_id'])
        comment['author_id'] = str(comment['author_id'])
        comment['created_at'] = comment['created_at'].isoformat()
        del comment['_id']
        
        return jsonify({
            'message': 'Đã thêm bình luận',
            'comment': comment
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment_alt(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Nội dung bình luận là bắt buộc'}), 400
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        comment = {
            '_id': ObjectId(),
            'author_id': ObjectId(user_id),
            'author_name': user['name'],
            'author_avatar': user.get('avatar', ''),
            'content': data['content'],
            'created_at': datetime.utcnow()
        }
        
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$push': {'comments': comment}}
        )
        
        # Convert for response
        comment['id'] = str(comment['_id'])
        comment['author_id'] = str(comment['author_id'])
        comment['created_at'] = comment['created_at'].isoformat()
        del comment['_id']
        
        return jsonify({
            'message': 'Đã thêm bình luận',
            'comment': comment
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>/react', methods=['POST'])
@jwt_required()
def react_to_post(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        reaction_type = data.get('type', 'like')  # like, love, laugh, angry, sad
        if reaction_type not in ['like', 'love', 'laugh', 'angry', 'sad']:
            return jsonify({'error': 'Loại cảm xúc không hợp lệ'}), 400
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        user_object_id = ObjectId(user_id)
        reactions = post.get('reactions', {})
        
        # Remove user from all reaction types first
        for rtype in ['like', 'love', 'laugh', 'angry', 'sad']:
            if rtype in reactions:
                reactions[rtype] = [uid for uid in reactions[rtype] if uid != user_object_id]
        
        # Add user to the new reaction type
        if reaction_type not in reactions:
            reactions[reaction_type] = []
        reactions[reaction_type].append(user_object_id)
        
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': {'reactions': reactions}}
        )
        
        return jsonify({'message': f'Đã thể hiện cảm xúc {reaction_type}'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts/<post_id>/reactions', methods=['POST'])
@jwt_required()
def add_reaction(post_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        reaction_type = data.get('reaction_type', 'like')  # like, love, laugh, angry, sad
        if reaction_type not in ['like', 'love', 'laugh', 'angry', 'sad']:
            return jsonify({'error': 'Loại cảm xúc không hợp lệ'}), 400
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        if not post:
            return jsonify({'error': 'Bài viết không tồn tại'}), 404
        
        user_object_id = ObjectId(user_id)
        reactions = post.get('reactions', {})
        
        # Remove user from all reaction types first
        for rtype in ['like', 'love', 'laugh', 'angry', 'sad']:
            if rtype in reactions:
                reactions[rtype] = [uid for uid in reactions[rtype] if uid != user_object_id]
        
        # Add user to the new reaction type
        if reaction_type not in reactions:
            reactions[reaction_type] = []
        reactions[reaction_type].append(user_object_id)
        
        posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': {'reactions': reactions}}
        )
        
        return jsonify({'message': f'Đã thể hiện cảm xúc {reaction_type}'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/users', methods=['GET'])
@jwt_required()
def search_users():
    try:
        query = request.args.get('q', '')
        
        if not query:
            return jsonify([]), 200
        
        current_user_id = get_jwt_identity()
        current_user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        friends = current_user.get('friends', [])

        # Lấy danh sách user đã gửi hoặc nhận lời mời kết bạn
        sent_requests = friends_collection.find({'from_user': ObjectId(current_user_id), 'status': 'pending'})
        received_requests = friends_collection.find({'to_user': ObjectId(current_user_id), 'status': 'pending'})
        sent_ids = [req['to_user'] for req in sent_requests]
        received_ids = [req['from_user'] for req in received_requests]

        exclude_ids = set(friends + sent_ids + received_ids + [ObjectId(current_user_id)])

        users = list(users_collection.find({
            '$and': [
                {
                    '$or': [
                        {'name': {'$regex': query, '$options': 'i'}},
                        {'email': {'$regex': query, '$options': 'i'}}
                    ]
                },
                {'_id': {'$nin': list(exclude_ids)}}
            ]
        }).limit(10))

        result = []
        for user in users:
            result.append({
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'avatar': user.get('avatar', '')
            })
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/friends/request', methods=['POST'])
@jwt_required()
def send_friend_request():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        friend_id = data.get('friend_id')
        if not friend_id:
            return jsonify({'error': 'Friend ID là bắt buộc'}), 400
        
        if user_id == friend_id:
            return jsonify({'error': 'Không thể kết bạn với chính mình'}), 400
        
        # Kiểm tra user tồn tại
        friend = users_collection.find_one({'_id': ObjectId(friend_id)})
        if not friend:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        # Kiểm tra đã là bạn chưa
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if ObjectId(friend_id) in user.get('friends', []):
            return jsonify({'error': 'Đã là bạn bè'}), 400
        
        # Kiểm tra đã gửi lời mời chưa
        existing_request = friends_collection.find_one({
            'from_user': ObjectId(user_id),
            'to_user': ObjectId(friend_id),
            'status': 'pending'
        })
        
        if existing_request:
            return jsonify({'error': 'Đã gửi lời mời kết bạn'}), 400
        
        # Tạo friend request
        friend_request = {
            'from_user': ObjectId(user_id),
            'to_user': ObjectId(friend_id),
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        friends_collection.insert_one(friend_request)
        
        return jsonify({'message': 'Đã gửi lời mời kết bạn'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/friends/requests', methods=['GET'])
@jwt_required()
def get_friend_requests():
    try:
        user_id = get_jwt_identity()
        
        # Lấy lời mời kết bạn đang chờ
        requests = list(friends_collection.find({
            'to_user': ObjectId(user_id),
            'status': 'pending'
        }))
        
        result = []
        for req in requests:
            from_user = users_collection.find_one({'_id': req['from_user']})
            result.append({
                'id': str(req['_id']),
                'from_user': {
                    'id': str(from_user['_id']),
                    'name': from_user['name'],
                    'avatar': from_user.get('avatar', '')
                },
                'created_at': req['created_at'].isoformat()
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/friends/accept', methods=['POST'])
@jwt_required()
def accept_friend_request():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        request_id = data.get('request_id')
        if not request_id:
            return jsonify({'error': 'Request ID là bắt buộc'}), 400
        
        # Tìm friend request
        friend_request = friends_collection.find_one({
            '_id': ObjectId(request_id),
            'to_user': ObjectId(user_id),
            'status': 'pending'
        })
        
        if not friend_request:
            return jsonify({'error': 'Lời mời không tồn tại'}), 404
        
        from_user_id = friend_request['from_user']
        
        # Cập nhật status thành accepted
        friends_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': 'accepted', 'accepted_at': datetime.utcnow()}}
        )
        
        # Thêm vào danh sách bạn bè của cả hai user
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$addToSet': {'friends': from_user_id}}
        )
        users_collection.update_one(
            {'_id': from_user_id},
            {'$addToSet': {'friends': ObjectId(user_id)}}
        )
        
        return jsonify({'message': 'Đã chấp nhận lời mời kết bạn'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/friends', methods=['GET'])
@jwt_required()
def get_friends():
    try:
        user_id = get_jwt_identity()
        
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        friends_list = user.get('friends', [])
        
        friends = []
        for friend_id in friends_list:
            friend = users_collection.find_one({'_id': friend_id})
            if friend:
                friends.append({
                    'id': str(friend['_id']),
                    'name': friend['name'],
                    'avatar': friend.get('avatar', ''),
                    'email': friend['email']
                })
        
        return jsonify(friends), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Messaging APIs
@app.route('/api/messages', methods=['POST'])
@jwt_required()
def send_message_new():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        to_user_id = data.get('to_user_id')
        content = data.get('content')
        
        if not to_user_id:
            return jsonify({'error': 'to_user_id là bắt buộc'}), 400
        
        if not content and not data.get('image'):
            return jsonify({'error': 'Nội dung tin nhắn hoặc ảnh là bắt buộc'}), 400
        
        # Kiểm tra có phải bạn bè không
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        friends_list = user.get('friends', [])
        if ObjectId(to_user_id) not in friends_list:
            return jsonify({'error': 'Chỉ có thể nhắn tin với bạn bè'}), 403
        
        # Handle image upload if present
        image_url = ''
        if data.get('image'):
            image_url = save_base64_image(data['image'])
            if not image_url:
                return jsonify({'error': 'Lỗi khi upload ảnh'}), 400
        
        message = {
            'from_user': ObjectId(user_id),
            'to_user': ObjectId(to_user_id),
            'content': content or '',
            'image_url': image_url,
            'created_at': datetime.utcnow(),
            'read': False
        }
        
        result = messages_collection.insert_one(message)
        
        return jsonify({
            'message': 'Tin nhắn đã được gửi',
            'message_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/send', methods=['POST'])
@jwt_required()
def send_message():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        to_user_id = data.get('to_user_id')
        content = data.get('content')
        
        if not to_user_id or not content:
            return jsonify({'error': 'to_user_id và content là bắt buộc'}), 400
        
        # Kiểm tra có phải bạn bè không
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if ObjectId(to_user_id) not in user.get('friends', []):
            return jsonify({'error': 'Chỉ có thể nhắn tin với bạn bè'}), 403
        
        # Handle image upload
        image_url = ''
        if data.get('image'):
            image_url = save_base64_image(data['image'])
            if not image_url:
                return jsonify({'error': 'Lỗi khi upload ảnh'}), 400
        
        message = {
            'from_user': ObjectId(user_id),
            'to_user': ObjectId(to_user_id),
            'content': content,
            'image_url': image_url,
            'created_at': datetime.utcnow(),
            'read': False
        }
        
        result = messages_collection.insert_one(message)
        
        return jsonify({
            'message': 'Tin nhắn đã được gửi',
            'message_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<friend_id>', methods=['GET'])
@jwt_required()
def get_messages(friend_id):
    try:
        user_id = get_jwt_identity()
        
        # Kiểm tra có phải bạn bè không
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if ObjectId(friend_id) not in user.get('friends', []):
            return jsonify({'error': 'Chỉ có thể xem tin nhắn với bạn bè'}), 403
        
        # Lấy tin nhắn giữa 2 user
        messages = list(messages_collection.find({
            '$or': [
                {'from_user': ObjectId(user_id), 'to_user': ObjectId(friend_id)},
                {'from_user': ObjectId(friend_id), 'to_user': ObjectId(user_id)}
            ]
        }).sort('created_at', 1))
        
        result = []
        for msg in messages:
            result.append({
                'id': str(msg['_id']),
                'from_user': str(msg['from_user']),
                'to_user': str(msg['to_user']),
                'content': msg['content'],
                'image_url': f"http://localhost:5000{msg['image_url']}" if msg.get('image_url') else '',
                'created_at': msg['created_at'].isoformat(),
                'read': msg.get('read', False)
            })
        
        # Đánh dấu đã đọc tin nhắn từ friend
        messages_collection.update_many(
            {'from_user': ObjectId(friend_id), 'to_user': ObjectId(user_id)},
            {'$set': {'read': True}}
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        user_id = get_jwt_identity()
        
        # Lấy danh sách bạn bè
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        friends_list = user.get('friends', [])
        if not friends_list:
            return jsonify([]), 200
        
        # Lấy danh sách conversation (người đã nhắn tin)
        pipeline = [
            {
                '$match': {
                    '$or': [
                        {'from_user': ObjectId(user_id)},
                        {'to_user': ObjectId(user_id)}
                    ]
                }
            },
            {
                '$addFields': {
                    'other_user': {
                        '$cond': {
                            'if': {'$eq': ['$from_user', ObjectId(user_id)]},
                            'then': '$to_user',
                            'else': '$from_user'
                        }
                    }
                }
            },
            {
                '$sort': {'created_at': -1}
            },
            {
                '$group': {
                    '_id': '$other_user',
                    'last_message': {'$first': '$$ROOT'}
                }
            }
        ]
        
        conversations = list(messages_collection.aggregate(pipeline))
        
        result = []
        conversed_friends = set()
        
        # Thêm conversations có tin nhắn
        for conv in conversations:
            other_user = users_collection.find_one({'_id': conv['_id']})
            if other_user and conv['_id'] in friends_list:
                conversed_friends.add(conv['_id'])
                last_msg = conv['last_message']
                result.append({
                    'user': {
                        'id': str(other_user['_id']),
                        'name': other_user['name'],
                        'avatar': other_user.get('avatar', '')
                    },
                    'last_message': {
                        'content': last_msg['content'] if last_msg['content'] else '[Hình ảnh]',
                        'created_at': last_msg['created_at'].isoformat(),
                        'from_me': str(last_msg['from_user']) == user_id
                    }
                })
        
        # Thêm bạn bè chưa có tin nhắn
        for friend_id in friends_list:
            if friend_id not in conversed_friends:
                friend = users_collection.find_one({'_id': friend_id})
                if friend:
                    result.append({
                        'user': {
                            'id': str(friend['_id']),
                            'name': friend['name'],
                            'avatar': friend.get('avatar', '')
                        },
                        'last_message': {
                            'content': 'Chưa có tin nhắn nào',
                            'created_at': friend.get('created_at', datetime.utcnow()).isoformat(),
                            'from_me': False
                        }
                    })
        
        # Sắp xếp theo thời gian tin nhắn cuối (conversations có tin nhắn lên đầu)
        result.sort(key=lambda x: (
            x['last_message']['content'] == 'Chưa có tin nhắn nào',  # False trước True
            x['last_message']['created_at']
        ), reverse=True)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Profile APIs
@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        return jsonify({
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'avatar': user.get('avatar', ''),
            'bio': user.get('bio', ''),
            'created_at': user['created_at'].isoformat(),
            'friends': [str(friend_id) for friend_id in user.get('friends', [])]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>/posts', methods=['GET'])
@jwt_required()
def get_user_posts(user_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Kiểm tra quyền xem bài viết
        if user_id != current_user_id:
            # Kiểm tra có phải bạn bè không
            current_user = users_collection.find_one({'_id': ObjectId(current_user_id)})
            if ObjectId(user_id) not in current_user.get('friends', []):
                return jsonify({'error': 'Chỉ có thể xem bài viết của bạn bè'}), 403
        
        # Lấy bài viết của user
        posts = list(posts_collection.find({
            'author_id': ObjectId(user_id)
        }).sort('created_at', -1))
        
        # Populate thông tin author
        for post in posts:
            author = users_collection.find_one({'_id': post['author_id']})
            if not author:
                continue
                
            post['author'] = {
                'id': str(author['_id']),
                'name': author['name'],
                'avatar': author.get('avatar', '')
            }
            post['id'] = str(post['_id'])
            
            # Convert datetime to string
            if 'created_at' in post:
                post['created_at'] = post['created_at'].isoformat()
            
            # Convert ObjectId lists to string lists
            if 'likes' in post:
                post['likes'] = [str(like_id) for like_id in post['likes']]
            
            # Convert reactions ObjectIds to strings
            if 'reactions' in post:
                for reaction_type, user_ids in post['reactions'].items():
                    post['reactions'][reaction_type] = [str(uid) for uid in user_ids]
            else:
                post['reactions'] = {
                    'like': [], 'love': [], 'laugh': [], 'angry': [], 'sad': []
                }
            
            # Convert comments ObjectIds to strings and datetime
            if 'comments' in post:
                for comment in post['comments']:
                    if '_id' in comment:
                        comment['id'] = str(comment['_id'])
                        del comment['_id']
                    if 'author_id' in comment:
                        comment['author_id'] = str(comment['author_id'])
                    if 'created_at' in comment:
                        comment['created_at'] = comment['created_at'].isoformat()
                        
            # Update image URL to include full path
            if post.get('image_url'):
                post['image_url'] = f"http://localhost:5000{post['image_url']}"
                
            del post['_id']
            del post['author_id']
        
        return jsonify(posts), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name']
        
        if 'bio' in data:
            update_data['bio'] = data['bio']
        
        if 'avatar' in data:
            # Handle avatar upload
            avatar_url = save_base64_image(data['avatar'])
            if avatar_url:
                update_data['avatar'] = f"http://localhost:5000{avatar_url}"
        
        if not update_data:
            return jsonify({'error': 'Không có dữ liệu để cập nhật'}), 400
        
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        # Lấy thông tin user đã cập nhật
        updated_user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        return jsonify({
            'message': 'Cập nhật thông tin thành công',
            'user': {
                'id': str(updated_user['_id']),
                'name': updated_user['name'],
                'email': updated_user['email'],
                'avatar': updated_user.get('avatar', ''),
                'bio': updated_user.get('bio', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/friends/status/<user_id>', methods=['GET'])
@jwt_required()
def get_friendship_status(user_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Kiểm tra có phải bạn bè không
        current_user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        is_friend = ObjectId(user_id) in current_user.get('friends', [])
        
        # Kiểm tra có lời mời kết bạn đang chờ không
        request_sent = friends_collection.find_one({
            'from_user': ObjectId(current_user_id),
            'to_user': ObjectId(user_id),
            'status': 'pending'
        }) is not None
        
        return jsonify({
            'isFriend': is_friend,
            'requestSent': request_sent
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
