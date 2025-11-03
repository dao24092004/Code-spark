FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY truffle-config.js ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Compile Truffle contracts
RUN npm run compile || echo "Truffle compile skipped - will compile at runtime"

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

