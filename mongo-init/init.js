// MongoDB initialization script
db = db.getSiblingDB('web_zui');

// Create collections
db.createCollection('users');
db.createCollection('posts');
db.createCollection('friends');
db.createCollection('messages');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.posts.createIndex({ "created_at": -1 });
db.posts.createIndex({ "author_id": 1 });
db.friends.createIndex({ "from_user": 1, "to_user": 1 });
db.messages.createIndex({ "from_user": 1, "to_user": 1 });
db.messages.createIndex({ "created_at": -1 });

print("Database initialization completed!");
