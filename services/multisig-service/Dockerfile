# Giai đoạn 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Giai đoạn 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./

# Expose cổng mà service sẽ chạy bên trong container
EXPOSE 3001

# Lệnh để khởi động service
CMD ["npm", "start"]