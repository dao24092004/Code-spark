# 🚀 Copyright Service

Node.js microservice for copyright registration with blockchain integration.

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### Setup and Run
```bash
# 1. Clone the repository and navigate to the service directory
cd services/copyright-service

# 2. Deploy smart contracts (one-time setup)
docker-compose --profile deploy up

# 3. Start all services
docker-compose up -d

# 4. Check service status
docker-compose ps

# 5. View logs (optional)
docker-compose logs -f copyright-service
```

The service will be available at:
- **API**: http://localhost:3000
- **Blockchain (Ganache)**: http://localhost:7545
- **Database (PostgreSQL)**: localhost:5432

#### Service Management
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (removes database data)
docker-compose down -v

# Redeploy contracts and restart
docker-compose --profile deploy up && docker-compose up -d

# Scale the service
docker-compose up -d --scale copyright-service=3
```

### Option 2: Local Development

#### Prerequisites
- Node.js 18+
- PostgreSQL running
- Ganache blockchain running

#### Installation
```bash
npm install
```

#### Configuration
Copy `.env` and update the following variables:
```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=copyright_db
DB_USER=postgres
DB_PASSWORD=password

# Security
JWT_SECRET=your-secret-key-here

# Service Discovery
EUREKA_HOST=localhost
EUREKA_PORT=9999
SERVICE_DISCOVERY_ENABLED=true

# API Gateway
API_GATEWAY_BASE_URL=http://localhost:8080

# Blockchain (make sure Ganache is running on port 7545)
WEB3_PROVIDER_URL=http://localhost:7545
ACCOUNT_PRIVATE_KEY=your-private-key-here
CONTRACT_ADDRESS=your-deployed-contract-address-here
```

#### Run
```bash
npm start
```

## 📚 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /status` - Detailed status
- `GET /api-docs` - API documentation

### Copyright Operations (Auth required)
- `GET /api/copyrights` - List all copyrights
- `POST /api/copyrights` - Create new copyright
- `GET /api/copyrights/:id` - Get copyright by ID
- `PUT /api/copyrights/:id` - Update copyright
- `DELETE /api/copyrights/:id` - Delete copyright
- `POST /api/copyrights/check-similarity` - Check similarity

### Authentication
All copyright endpoints require JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## 🔧 Features

- ✅ JWT Authentication & Authorization
- ✅ Service Discovery (Eureka)
- ✅ API Gateway Integration
- ✅ Rate Limiting
- ✅ CORS Support
- ✅ Request Logging
- ✅ Error Handling
- ✅ Health Monitoring
- ✅ File Upload Support
- ✅ Blockchain Integration
- ✅ Docker Containerization
- ✅ PostgreSQL Database
- ✅ Automated Smart Contract Deployment

## 📁 Project Structure

```
src/
├── config/           # Configuration
│   └── web3.js      # Blockchain configuration
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
│   ├── blockchain.service.js    # Blockchain interactions
│   ├── similarity.service.js    # Document similarity checking
│   └── file.service.js          # File handling
├── discovery/       # Service discovery
└── utils/           # Utility functions

contracts/           # Smart contracts
scripts/            # Deployment scripts
uploads/            # File uploads directory
```

## 🐳 Docker Architecture

The Docker setup includes:

- **copyright-service**: Main Node.js application
- **postgres**: PostgreSQL database with persistent storage
- **ganache**: Ethereum blockchain node for development
- **contract-deployer**: One-time smart contract deployment service

### Environment Variables (Docker)

| Variable | Description | Default |
|----------|-------------|---------|
| `ACCOUNT_PRIVATE_KEY` | Ethereum account private key | Required |
| `SERVICE_DISCOVERY_ENABLED` | Enable Eureka service discovery | `false` |
| `API_GATEWAY_BASE_URL` | API Gateway base URL | `http://localhost:8080` |

## 🚀 Deployment

### Development Deployment
```bash
# Start with hot reload (using nodemon)
docker-compose -f docker-compose.dev.yml up

# Or use regular compose for production-like environment
docker-compose up -d
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

1. **Contract deployment fails**
   ```bash
   # Check if Ganache is running
   docker-compose logs ganache

   # Redeploy contracts
   docker-compose --profile deploy up
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres

   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Service discovery issues**
   ```bash
   # Check if Eureka server is running
   curl http://localhost:9999/eureka/apps
   ```

### Logs and Monitoring

```bash
# View all logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f copyright-service

# Check service health
curl http://localhost:3000/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if necessary
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.
