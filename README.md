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

```envPORT=3000
MONGODB_URI=mongodb://localhost:27017/dapp-db

# Document Store ABI
DocumentRegistryABI = [{"inputs":[{"internalType":"address","name":"admin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"signer","type":"address"},{"indexed":false,"internalType":"bool","name":"active","type":"bool"}],"name":"DocumentSignerWhiteListed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"fromContract","type":"address"},{"indexed":true,"internalType":"address","name":"toContract","type":"address"},{"indexed":false,"internalType":"bool","name":"allowed","type":"bool"}],"name":"InteropAllowed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentType","type":"bytes32"},{"indexed":true,"internalType":"address","name":"issuer","type":"address"},{"indexed":false,"internalType":"bool","name":"active","type":"bool"}],"name":"IssuerWhiteListed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentType","type":"bytes32"},{"indexed":false,"internalType":"uint8","name":"count","type":"uint8"}],"name":"RequiredSignerCountSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentType","type":"bytes32"},{"indexed":true,"internalType":"address","name":"signer","type":"address"},{"indexed":false,"internalType":"bool","name":"active","type":"bool"}],"name":"SignerWhiteListed","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REGISTRY_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowCall","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"allowedIssuer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"allowedSigner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"allowedSignerForDocument","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"requiredSignerCount","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"fromContract","type":"address"},{"internalType":"address","name":"toContract","type":"address"},{"internalType":"bool","name":"allowed","type":"bool"}],"name":"setInterop","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentType","type":"bytes32"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"bool","name":"active","type":"bool"}],"name":"setIssuer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentType","type":"bytes32"},{"internalType":"uint8","name":"count","type":"uint8"}],"name":"setRequiredSignerCount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentType","type":"bytes32"},{"internalType":"address","name":"signer","type":"address"},{"internalType":"bool","name":"active","type":"bool"}],"name":"setSigner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"},{"internalType":"address","name":"signer","type":"address"},{"internalType":"bool","name":"active","type":"bool"}],"name":"setSignerForDocument","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
DocumentStoreABI = [{"inputs":[{"internalType":"address","name":"admin","type":"address"},{"internalType":"address","name":"registry_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentId","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"documentType","type":"bytes32"},{"indexed":false,"internalType":"address","name":"issuer","type":"address"},{"indexed":false,"internalType":"bytes32","name":"documentHash","type":"bytes32"}],"name":"DocumentIssued","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"revoker","type":"address"},{"indexed":false,"internalType":"enum DocumentStore.RevokeReason","name":"reason","type":"uint8"}],"name":"DocumentRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"documentId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"signer","type":"address"}],"name":"DocumentSigned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"ISSUER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REVOKER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SIGNER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"}],"name":"isIssued","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"}],"name":"isSigned","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"},{"internalType":"bytes32","name":"documentHash","type":"bytes32"},{"internalType":"bytes32","name":"documentType","type":"bytes32"}],"name":"issue","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"meta","outputs":[{"internalType":"bytes32","name":"documentHash","type":"bytes32"},{"internalType":"bytes32","name":"documentType","type":"bytes32"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"uint64","name":"issuedAt","type":"uint64"},{"internalType":"uint64","name":"revokedAt","type":"uint64"},{"internalType":"enum DocumentStore.State","name":"state","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"registry","outputs":[{"internalType":"contract IDocumentRegistry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"},{"internalType":"enum DocumentStore.RevokeReason","name":"reason","type":"uint8"}],"name":"revoke","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"documentId","type":"bytes32"}],"name":"sign","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"signedAt","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
DocumentStoreFactoryABI = [{"inputs":[{"internalType":"address","name":"admin","type":"address"},{"internalType":"address","name":"registry_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"fromContract","type":"address"},{"indexed":true,"internalType":"address","name":"toContract","type":"address"},{"indexed":false,"internalType":"bool","name":"allowed","type":"bool"}],"name":"InteropConfigured","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"orgId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"store","type":"address"},{"indexed":true,"internalType":"address","name":"admin","type":"address"}],"name":"StoreCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"store","type":"address"},{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"bool","name":"granted","type":"bool"}],"name":"StoreRoleUpdated","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FACTORY_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allStores","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"organisationId","type":"bytes32"},{"internalType":"address","name":"storeAdmin","type":"address"}],"name":"createStore","outputs":[{"internalType":"address","name":"store","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"store","type":"address"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"address","name":"revoker","type":"address"},{"internalType":"address","name":"signer","type":"address"}],"name":"grantStandardRoles","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"store","type":"address"}],"name":"orgIdOf","outputs":[{"internalType":"bytes32","name":"orgId","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"organisationAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"organisationStore","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"registry","outputs":[{"internalType":"contract IDocumentRegistry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"fromContract","type":"address"},{"internalType":"address","name":"toContract","type":"address"},{"internalType":"bool","name":"allowed","type":"bool"}],"name":"setInterop","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"store","type":"address"},{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"},{"internalType":"bool","name":"grant","type":"bool"}],"name":"setStoreRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"storeAt","outputs":[{"internalType":"address","name":"store","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"storesLength","outputs":[{"internalType":"uint256","name":"count","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]

# Smart Contracts
RPC_URL=http://127.0.0.1:8545

# Registry Admin
WALLET_ADDR_1 = 
PRIVATE_KEY_1 = 

# Factory Admin
WALLET_ADDR_2 = 
PRIVATE_KEY_2 = 

# Sales Quoter
WALLET_ADDR_3 = 
PRIVATE_KEY_3 = 

# Purchase Orderer
WALLET_ADDR_4 = 
PRIVATE_KEY_4 = 

# Invoicer
WALLET_ADDR_5 = 
PRIVATE_KEY_5 = 

DocumentRegistryAddress = 0x4A679253410272dd5232B3Ff7cF5dbB88f295319
DocumentStoreFactoryAddress = 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
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
