# Backend Dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
