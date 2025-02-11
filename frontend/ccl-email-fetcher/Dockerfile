# Frontend Dockerfile
# frontend/ccl-email-fetcher/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]