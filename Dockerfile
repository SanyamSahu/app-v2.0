FROM node:18-alpine

# Install MySQL client for database operations
RUN apk add --no-cache mysql-client

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy ALL project files (excluding what's in .dockerignore)
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]