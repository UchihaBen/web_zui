# Use Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variable to make React dev server accessible from outside container
ENV HOST=0.0.0.0

# Start React development server
CMD ["npm", "start"]
