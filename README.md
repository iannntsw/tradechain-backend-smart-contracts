# TradeChain - Secure Trade Document Management

A blockchain-powered platform for secure trade document management and verification using Ethereum smart contracts, Node.js backend, and Next.js frontend.

## 🏗️ Project Structure

```
TradeChain/
├── smart-contract/     # Hardhat smart contracts
├── backend/           # Node.js/Express API server
├── frontend/          # Next.js React application
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Git

### 1. Smart Contract Setup

```bash
# Navigate to smart contract directory
cd smart-contract

# Install dependencies
npm install

# Start local Hardhat node (in terminal 1)
npx hardhat node

# Deploy contracts (in terminal 2)
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Keep the Hardhat node running and copy the contract addresses from the deployment output.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.template .env

# Configure environment variables
# Edit .env file with the following:
# 1. Copy the first 5 accounts from your Hardhat node
# 2. Replace DocumentRegistryAddress and DocumentStoreFactoryAddress with deployed addresses
# 3. Set your MongoDB connection string

# Seed test users
npm run seed

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Configuration

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/tradechain

# JWT
JWT_SECRET=your_jwt_secret_here

# Blockchain - Copy from Hardhat node (first 5 accounts)
PRIVATE_KEY_1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PRIVATE_KEY_2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
PRIVATE_KEY_3=0x5de4111daa5ba4e5b4d7bdf8c568e82c4a9c4d3b3b3b3b3b3b3b3b3b3b3b3b3b3b
PRIVATE_KEY_4=0x7c852118294e51e653712a81e05800f9cbb3abd46d505dbd279fdd6c85f58f3c
PRIVATE_KEY_5=0x47e179ec197488593b187f80a5eb5f98f91a4e4eda56e1d1f9cd2ca6c87f9f6f

# Wallet Addresses (for seed script)
WALLET_ADDR_3=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
WALLET_ADDR_4=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
WALLET_ADDR_5=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

# Contract Addresses (from deployment)
DOCUMENT_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
DOCUMENT_STORE_FACTORY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## 👥 Test Users

The seed script creates three test users:

| Name | Email | Password | Role | Organization |
|------|-------|----------|------|--------------|
| Ian | sales@gmail.com | password | Sales | sales-business |
| Donovan | purchase@gmail.com | password | Purchase | purchase-business |
| Dylan | invoice@gmail.com | password | Invoice | invoice-business |

## 🛠️ Available Scripts

### Smart Contract
```bash
npm run compile    # Compile contracts
npm run test       # Run tests
npm run deploy     # Deploy to localhost
```

### Backend
```bash
nodemon app.js        # Start development server with nodemon
npm run seed       # Create test users
```

### Frontend
```bash
npm run dev        # Start development server
```

## 📋 Features

### Document Management
- Create trade documents (Sales Quotes, Invoices, Payment Orders, Delivery Orders)
- Digital signatures with blockchain verification
- Document revocation capabilities
- Document verification and validation

### User Management
- Role-based access control (Sales, Purchase, Invoice)
- JWT-based authentication
- Organization-based document isolation

### Blockchain Integration
- Ethereum smart contracts for document storage
- Merkle tree-based document verification
- Immutable document history
- Gas-optimized operations

## 🔐 Security Features

- **Cryptographic Verification**: SHA3 Merkle proofs for document integrity
- **Blockchain Immutability**: Documents stored on Ethereum blockchain
- **Role-based Access**: Different permissions for different user types
- **JWT Authentication**: Secure API access
- **Document Revocation**: Ability to revoke documents with reasons

## 🏛️ Smart Contracts

### DocumentRegistry
- Manages document store factories
- Tracks document store deployments
- Provides factory discovery

### DocumentStore
- Stores document hashes and metadata
- Manages document states (None, Issued, Signed, Revoked)
- Handles document signing and revocation
- Provides verification functions

### DocumentStoreFactory
- Deploys new DocumentStore instances
- Manages document store creation
- Links stores to organizations

## 🚨 Troubleshooting

### Common Issues

1. **"Cannot connect to MongoDB"**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

2. **"Contract not deployed"**
   - Verify Hardhat node is running
   - Check contract addresses in .env file
   - Redeploy contracts if needed

3. **"User creation failed"**
   - Check if users already exist
   - Verify wallet addresses are correct
   - Ensure backend server is running

4. **"Frontend not loading"**
   - Check if backend is running on port 3000
   - Verify API endpoints are accessible
   - Check browser console for errors

### Reset Everything

```bash
# Stop all services
# Clear MongoDB database
# Restart Hardhat node
# Redeploy contracts
# Update .env with new addresses
# Run seed script again
```

## 📚 API Documentation

### Authentication
- `POST /user/new` - Create new user
- `POST /auth/login` - User login
- `GET /auth/verify` - Verify JWT token

### Documents
- `POST /document/issue` - Issue new document
- `GET /documents/all` - Get all user documents
- `GET /document/single` - Get single document
- `POST /document/sign` - Sign document
- `POST /document/revoke` - Revoke document
- `POST /document/verify` - Verify document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Happy Trading! 🚀**
