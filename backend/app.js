require("dotenv").config();
const express = require("express");
const { connectDB, disconnectDB } = require("./src/db");
const { ethers, NonceManager } = require("ethers");
const {
  buildLeaves,
  merkleRoot,
  wrapDocument,
} = require("./src/helpers/merkle-root");
const { verifyWrappedMerkle } = require("./src/helpers/verify-merkle-root");
const User = require("./src/models/User");
const Documents = require("./src/models/Documents");
const { generateToken, authenticateToken } = require("./src/utils/jwt");

const app = express();
app.use(express.json());

// CORS configuration
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

const {
  RPC_URL,
  DocumentRegistryAddress,
  DocumentStoreFactoryAddress,
  DocumentRegistryABI,
  DocumentStoreFactoryABI,
  DocumentStoreABI,
} = process.env;
const admin = process.env.PRIVATE_KEY_1;
const deployer = process.env.PRIVATE_KEY_2;
const salesAdmin = process.env.PRIVATE_KEY_3;
const purchaseAdmin = process.env.PRIVATE_KEY_4;
const invoiceAdmin = process.env.PRIVATE_KEY_5;

if (!salesAdmin || !purchaseAdmin || !invoiceAdmin) {
  throw new Error(
    "Missing salesAdmin, purchaseAdmin, or invoiceAdmin private keys in .env"
  );
}

if (!RPC_URL || !DocumentRegistryAddress || !DocumentStoreFactoryAddress) {
  throw new Error(
    "Missing RPC_URL or DocumentRegistryAddress or DocumentStoreFactoryAddress in .env"
  );
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const registry = DocumentRegistryAddress
  ? new ethers.Contract(DocumentRegistryAddress, DocumentRegistryABI, provider)
  : null;
const factory = DocumentStoreFactoryAddress
  ? new ethers.Contract(
      DocumentStoreFactoryAddress,
      DocumentStoreFactoryABI,
      provider
    )
  : null;

const factoryAdmin = new NonceManager(new ethers.Wallet(admin, provider));

// Create NonceManager instances for each user type (reused across requests)
const salesAdminWallet = new NonceManager(new ethers.Wallet(salesAdmin, provider));
const purchaseAdminWallet = new NonceManager(new ethers.Wallet(purchaseAdmin, provider));
const invoiceAdminWallet = new NonceManager(new ethers.Wallet(invoiceAdmin, provider));

const factoryWrite = new ethers.Contract(
  DocumentStoreFactoryAddress,
  DocumentStoreFactoryABI,
  factoryAdmin
);

const registryWrite = new ethers.Contract(
  DocumentRegistryAddress,
  DocumentRegistryABI,
  factoryAdmin
);

// helper functions
const toBytes32 = (s) => ethers.id(s);

/**
 * Selects the correct signer wallet based on userType.
 * @param {string} userType - e.g. "admin", "sales", "purchase", or "invoice"
 * @returns {ethers.Wallet} Corresponding signer wallet
 * @throws {Error} If userType is invalid
 */
function getSignerByUserType(userType) {
  switch (userType?.toLowerCase()) {
    case "admin":
      return factoryAdmin;
    case "sales":
      return salesAdminWallet;
    case "purchase":
      return purchaseAdminWallet;
    case "invoice":
      return invoiceAdminWallet;
    default:
      throw new Error(
        `❌ Invalid userType: ${userType}. Must be one of "admin", "sales", "purchase", "invoice".`
      );
  }
}

/**
 * Selects the correct signer wallet address based on userType.
 * Note: Admin user maps to WALLET_ADDR_1 (same as DocumentStoreFactory admin)
 * @param {string} userType - e.g. "admin", "sales", "purchase", or "invoice"
 * @returns {string} Corresponding wallet address
 * @throws {Error} If userType is invalid
 */
function getSignerAddressByUserType(userType) {
  switch (userType?.toLowerCase()) {
    case "admin":
      return process.env.WALLET_ADDR_1;
    case "sales":
      return process.env.WALLET_ADDR_3;
    case "purchase":
      return process.env.WALLET_ADDR_4;
    case "invoice":
      return process.env.WALLET_ADDR_5;
    default:
      throw new Error(
        `❌ Invalid userType: ${userType}. Must be one of "admin", "sales", "purchase", "invoice".`
      );
  }
}

// health check
app.get("/health", async (req, res) => {
  const net = await provider.getNetwork();
  res.status(200).json({
    status: "ok",
    chainId: Number(net.chainId),
    contract: registry.address,
    factory: factory.address,
  });
});

// create a user and document store
app.post("/user/new", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organisationId,
      documentStoreAdmin,
      userType,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !organisationId || !userType) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, password, organisationId, userType",
      });
    }

    // Check if user already exists using findOneByEmail
    const existingUser = await User.findOneByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    // Validate userType
    const validUserTypes = ["admin", "sales", "purchase", "invoice"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        error: `Invalid userType. Must be one of: ${validUserTypes.join(", ")}`,
      });
    }

    // Validate admin address if provided
    if (documentStoreAdmin && !ethers.isAddress(documentStoreAdmin)) {
      return res.status(400).json({
        error: "Invalid documentStoreAdmin address",
      });
    }

    // Convert to bytes32
    const bytes32OrganisationId = ethers.id(organisationId);

    // Create document store on blockchain
    const tx1 = await factoryWrite.createStore(
      bytes32OrganisationId,
      documentStoreAdmin || ethers.ZeroAddress
    );
    const rc1 = await tx1.wait();

    // Find the StoreCreated event in the receipt logs with retry mechanism
    let event = null;
    let storeAddress = null;
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 5000; // 2 seconds

    while (!event && retryCount < maxRetries) {
      console.log(`Attempting to find StoreCreated event (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Try to find the event in the current receipt logs
      event = rc1.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "StoreCreated");

      if (event) {
        storeAddress = event.args.store;
        console.log(`✅ StoreCreated event found on attempt ${retryCount + 1}: ${storeAddress}`);
        break;
      }

      // If event not found and we haven't reached max retries, wait and try again
      if (retryCount < maxRetries - 1) {
        console.log(`StoreCreated event not found, waiting ${retryInterval}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        
        // Try to get updated transaction receipt
        try {
          const updatedReceipt = await provider.getTransactionReceipt(tx1.hash);
          if (updatedReceipt && updatedReceipt.logs) {
            rc1.logs = updatedReceipt.logs;
            console.log(`Updated receipt with ${updatedReceipt.logs.length} logs`);
          }
        } catch (receiptError) {
          console.log(`Failed to get updated receipt: ${receiptError.message}`);
        }
      }
      
      retryCount++;
    }

    // If still no event found after all retries
    if (!event) {
      console.error(`❌ StoreCreated event not found after ${maxRetries} attempts`);
      console.error("Available logs:", rc1.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data
      })));
      throw new Error(`Failed to find StoreCreated event after ${maxRetries} attempts`);
    }

    // Create user in MongoDB (password will be automatically hashed by pre-save hook)
    const newUser = new User({
      name,
      email,
      password, // Will be automatically hashed using bcrypt
      organisationId,
      documentStoreAddress: storeAddress,
      userType,
    });

    await newUser.save();

    // Success response
    res.status(201).json({
      message: "✅ User and document store created successfully",
      user: newUser.toSafeObject(),
      transactionHash: rc1.hash,
      storeAddress,
    });
  } catch (err) {
    console.error("❌ Error creating user and document store:", err);

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        error: "User with this email already exists",
        field: "email",
      });
    }

    // Handle nonce-related errors
    if (err.message && err.message.includes("Nonce too high")) {
      console.error("❌ Nonce error detected. This usually means:");
      console.error("   1. The blockchain node is in automining mode");
      console.error("   2. Multiple transactions are being sent simultaneously");
      console.error("   3. The NonceManager is not properly tracking nonces");
      
      return res.status(500).json({
        error: "Blockchain transaction failed due to nonce conflict",
        details: "Please try again in a few seconds. If the problem persists, restart the blockchain node.",
        technicalDetails: err.message
      });
    }

    // Check if it's a contract revert
    const errorMsg =
      err.shortMessage || err.info?.error?.message || err.reason || err.message;

    res.status(500).json({
      error: "Failed to create user and document store",
      details: errorMsg,
    });
  }
});

// Get user by email
app.get("/user/email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    const user = await User.findOneByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "✅ User found",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("❌ Error finding user by email:", err);
    res.status(500).json({
      error: "Failed to find user",
      details: err.message,
    });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const userRecord = await User.findOneByEmail(email);

    if (!userRecord) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Add walletAddress to the userRecord without losing Mongoose methods
    const userType = userRecord.userType;
    userRecord.walletAddress = getSignerAddressByUserType(userType);

    // In production, use bcrypt to compare hashed passwords
    const isPasswordValid = await userRecord.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if user account is approved
    if (userRecord.status !== 'approved') {
      return res.status(403).json({
        error: "Account not approved. Please contact administrator.",
        status: userRecord.status
      });
    }

    // Generate JWT token
    const apiToken = generateToken(userRecord);

    res.status(200).json({
      message: "✅ Login successful",
      user: {...userRecord.toSafeObject(), walletAddress: userRecord.walletAddress},
      apiToken: apiToken,
      tokenType: "Bearer",
      expiresIn: "24h",
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({
      error: "Login failed",
      details: err.message,
    });
  }
});

// Get current user info using API token (protected endpoint)
app.get("/user/me", authenticateToken, async (req, res) => {
  try {
    // Find user by ID from token
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "✅ User info retrieved",
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("❌ Error getting user info:", err);
    res.status(500).json({
      error: "Failed to get user info",
      details: err.message,
    });
  }
});

// Verify token endpoint (useful for frontend to check if token is still valid)
app.get("/auth/verify", authenticateToken, async (req, res) => {
  try {
    res.status(200).json({
      message: "✅ Token is valid",
      user: req.user,
      valid: true,
    });
  } catch (err) {
    res.status(401).json({
      error: "Invalid token",
      valid: false,
    });
  }
});

// issue a document and allow a signer
app.post("/document/issue", authenticateToken, async (req, res) => {
  try {
    // Get current user from token
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { docDetails, recipient, quoteNumber, documentId } = req.body;
    const issuerDocStore = user.documentStoreAddress;
    const issuerSigner = getSignerByUserType(user.userType);

    const signer = await User.findOneByEmail(recipient.emailAddress);
    if (!signer) {
      return res.status(404).json({ error: "Signer not found" });
    }

    const documentSignerAddress = getSignerAddressByUserType(signer.userType);

    const { documentType } = docDetails;

    if (!documentId || !documentType)
      return res
        .status(400)
        .json({ error: "Missing documentId or documentType" });
    if (!ethers.isAddress(issuerDocStore))
      return res.status(400).json({ error: "Invalid documentStoreAddress" });
    if (documentSignerAddress && !ethers.isAddress(documentSignerAddress))
      return res.status(400).json({ error: "Invalid signer address" });

    if (await Documents.findOneByDocumentId(documentId)) {
      return res.status(400).json({ error: "Document already exists" });
    }

    const bytes32DocumentId = ethers.id(documentId);
    const bytes32DocumentType = ethers.id(documentType);

    const wrappedDocument = wrapDocument(req.body);
    const leaves = buildLeaves(wrappedDocument.data);
    const documentHash = `0x${merkleRoot(leaves).root}`;

    const documentStoreWrite = new ethers.Contract(
      issuerDocStore,
      DocumentStoreABI,
      issuerSigner
    );

    // --- Check if already issued ---
    const isAlreadyIssued = await documentStoreWrite.isIssued(
      bytes32DocumentId
    );
    if (isAlreadyIssued) {
      return res.status(400).json({
        error: "Document already issued",
        documentId,
      });
    }

    // --- Issue document ---
    const transactionHashes = [];
    const tx = await documentStoreWrite.issue(
      bytes32DocumentId,
      documentHash,
      bytes32DocumentType
    );
    await tx.wait();
    
    const issuedHash = { transactionHash: tx.hash, event: "DocumentIssued"}
    transactionHashes.push(issuedHash);

    // --- Whitelist signer for this document ---
    const isSignable = recipient.isSignable;
    if (documentSignerAddress && isSignable) {
      const SIGNER_ROLE = await documentStoreWrite.SIGNER_ROLE();
      const grantTx = await documentStoreWrite.grantRole(
        SIGNER_ROLE,
        documentSignerAddress
      );
      await grantTx.wait();
      transactionHashes.push({ transactionHash: grantTx.hash, event: "GrantRole"});

      const tx2 = await registryWrite.setSignerForDocument(
        bytes32DocumentId,
        documentSignerAddress,
        true
      );
      await tx2.wait();
      transactionHashes.push({ transactionHash: tx2.hash, event: "SetSignerForDocument"});
    }

    const isNowIssued = await documentStoreWrite.isIssued(bytes32DocumentId);

    const newDocument = new Documents({
      documentId,
      documentType,
      quoteNumber,
      documentHash,
      transactionHash: transactionHashes,
      issuerDocStore,
      signerDocStore: signer.documentStoreAddress,
      rawDocInfo: JSON.stringify(req.body),
      wrappedDocInfo: JSON.stringify(wrappedDocument),
      isSignable,
    });
    await newDocument.save();

    return res.status(200).json({
      message: "✅ Document issued successfully",
      issued: isNowIssued,
      transactionHash: tx.hash,
      documentSignerAddress,
      documentHash,
      wrappedDocument,
    });
  } catch (err) {
    console.error("❌ Error issuing document:", err);
    const msg =
      err.shortMessage || err.info?.error?.message || err.reason || err.message;
    res.status(500).json({ error: "Failed to issue document", details: msg });
  }
});

app.post("/document/sign", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({
        error: "Missing documentId",
      });
    }

    const document = await Documents.findOneByDocumentId(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const signer = getSignerByUserType(user.userType);
    const documentStoreWrite = new ethers.Contract(
      document.issuerDocStore,
      DocumentStoreABI,
      signer
    );
    const documentIdHash = toBytes32(documentId);

    // --- Check issuance before signing ---
    const isIssued = await documentStoreWrite.isIssued(documentIdHash);
    if (!isIssued) {
      return res
        .status(400)
        .json({ error: "Document has not been issued yet" });
    }

    // --- Check if already signed ---
    const isAlreadySigned = await documentStoreWrite.isSigned(documentIdHash);
    if (isAlreadySigned) {
      return res.status(400).json({ error: "Document already signed" });
    }

    // --- Sign the document ---
    const tx = await documentStoreWrite.sign(documentIdHash);
    await tx.wait();
    
    await Documents.findOneAndUpdate(
      { documentId },
      { $push: { transactionHash: { transactionHash: tx.hash, event: "DocumentSigned" } } }
    );

    const isNowSigned = await documentStoreWrite.signedAt(
      documentIdHash,
      signer
    );

    res.status(200).json({
      message: "✅ Document signed successfully",
      documentId,
      signedAt: isNowSigned.toString(),
      transactionHash: tx.hash,
    });
  } catch (err) {
    const msg = err.reason;
    console.error("❌ Error signing document:", msg);
    res.status(500).json({ error: "Failed to sign document", details: msg });
  }
});

app.post("/document/revoke", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { documentId, reason } = req.body;
    if (!documentId) {
      return res.status(400).json({
        error: "Missing documentId",
      });
    }

    // Validate reason parameter (optional, defaults to USER_REQUEST)
    const revokeReasons = {
      USER_REQUEST: 0,
      FRAUD: 1,
      REISSUED: 2,
      OTHER: 3
    };
    
    const revokeReason = reason ? revokeReasons[reason.toUpperCase()] : revokeReasons.USER_REQUEST;
    if (revokeReason === undefined) {
      return res.status(400).json({
        error: "Invalid revoke reason",
        details: "Must be one of: USER_REQUEST, FRAUD, REISSUED, OTHER"
      });
    }

    const document = await Documents.findOneByDocumentId(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get the revoker signer (should have REVOKER_ROLE)
    const revokerSigner = getSignerByUserType(user.userType);
    const documentStoreWrite = new ethers.Contract(
      document.issuerDocStore,
      DocumentStoreABI,
      revokerSigner
    );
    const documentIdHash = toBytes32(documentId);

    // --- Check current document state before revoking ---
    const isIssued = await documentStoreWrite.isIssued(documentIdHash);
    if (!isIssued) {
      return res
        .status(400)
        .json({ 
          error: "Document cannot be revoked", 
          details: "Document is not in Issued or Signed state" 
        });
    }

    // --- Revoke the document ---
    const tx = await documentStoreWrite.revoke(documentIdHash, revokeReason);
    await tx.wait();
    await Documents.findOneAndUpdate(
      { documentId },
      { $push: { transactionHash: { transactionHash: tx.hash, event: "DocumentRevoked" } } }
    );

    // --- Verify revocation ---
    const isStillIssued = await documentStoreWrite.isIssued(documentIdHash);
    if (isStillIssued) {
      return res.status(500).json({ 
        error: "Revocation failed", 
        details: "Document is still in Issued state after revocation attempt" 
      });
    }

    res.status(200).json({
      message: "✅ Document revoked successfully",
      documentId,
      reason: Object.keys(revokeReasons)[revokeReason],
      revokedAt: Math.floor(Date.now() / 1000).toString(),
      transactionHash: tx.hash,
    });
  } catch (err) {
    const msg = err.reason;
    console.error("❌ Error signing document:", msg);
    res.status(500).json({ error: "Failed to sign document", details: msg });
  }
});

app.post("/document/verify", async (req, res) => {
  try {
    const { documentId, wrappedDocument } = req.body;

    if (!documentId) {
      return res
        .status(400)
        .json({ error: "Missing documentId" });
    }

    const document = await Documents.findOneByDocumentId(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const documentStoreAddress = document.issuerDocStore;
    const signerDocStore = document.signerDocStore;
    const user = await User.findOneByDocStore(signerDocStore);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const signer = getSignerByUserType(user.userType);

    if (!ethers.isAddress(documentStoreAddress)) {
      return res.status(400).json({ error: "Invalid documentStoreAddress" });
    }

    const local = verifyWrappedMerkle(wrappedDocument);
    if (!local.ok) {
      return res
        .status(400)
        .json({ error: "Failed to verify document", details: local.reason });
    }

    // On-chain checks
    const documentIdHash = toBytes32(documentId);
    const documentStoreRead = new ethers.Contract(
      documentStoreAddress,
      DocumentStoreABI,
      provider
    );
    const bytes32DocumentId = ethers.id(documentId);
    const meta = await documentStoreRead.meta(bytes32DocumentId);
    
    const computedHex32 = "0x" + local.computedRoot.toLowerCase();
    const hashMatches = meta.documentHash.toLowerCase() === computedHex32;

    const isIssued = await documentStoreRead.isIssued(documentIdHash);
    const issuedAt = meta.issuedAt.toString();
    const signedAt = await documentStoreRead.signedAt(documentIdHash, signer);
    const revokedAt = meta.revokedAt.toString();

    return res.status(200).json({
      message: "✅ Document verification result",
      documentId,
      rawDocument: JSON.parse(document.rawDocInfo),
      issuedAt: issuedAt,
      signedAt: signedAt.toString(),
      revokedAt: revokedAt,
      verified: (isIssued && hashMatches) || (revokedAt > 0 && hashMatches),
    });
  } catch (err) {
    console.error("❌ Error verifying document:", err);
    const msg =
      err.shortMessage || err.info?.error?.message || err.reason || err.message;
    res.status(500).json({ error: "Failed to verify document", details: msg });
  }
});

app.get("/documents/all", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get Documents issued by user and assigned to user
    const issuedDocuments = await Documents.find({ issuerDocStore: user.documentStoreAddress }).select('-wrappedDocInfo');;
    const signedDocuments = await Documents.find({ signerDocStore: user.documentStoreAddress }).select('-wrappedDocInfo');

    const issuedDocumentsWithStatus = await Promise.all(issuedDocuments.map(async (document) => {
      const documentStoreRead = new ethers.Contract(
        document.issuerDocStore,
        DocumentStoreABI,
        provider
      );
      const signer = await User.findOneByDocStore(document.signerDocStore);
      const isIssued = await documentStoreRead.isIssued(ethers.id(document.documentId));
      const meta = await documentStoreRead.meta(ethers.id(document.documentId));
      const signedAt = await documentStoreRead.signedAt(ethers.id(document.documentId), getSignerByUserType(signer.userType));
      return {
        ...document.toObject(),
        isIssued,
        signedAt: signedAt.toString(),
        revokedAt: meta.revokedAt.toString(),
      };
    }));

    const signedDocumentsWithStatus = await Promise.all(signedDocuments.map(async (document) => {
      const documentStoreRead = new ethers.Contract(
        document.issuerDocStore,
        DocumentStoreABI,
        provider
      );
      const signer = await User.findOneByDocStore(document.signerDocStore);
      const isIssued = await documentStoreRead.isIssued(ethers.id(document.documentId));
      const meta = await documentStoreRead.meta(ethers.id(document.documentId));
      const signedAt = await documentStoreRead.signedAt(ethers.id(document.documentId), getSignerByUserType(signer.userType));
      return {
        ...document.toObject(),
        isIssued,
        signedAt: signedAt.toString(),
        revokedAt: meta.revokedAt.toString(),
      };
    }));

    const allDocuments = { issued: issuedDocumentsWithStatus,  signed: signedDocumentsWithStatus }

    res.status(200).json(allDocuments);
  } catch (err) {
    console.error("❌ Error getting all documents:", err);
    res.status(500).json({ error: "Failed to get all documents", details: err.message });
  }
});

app.get("/document/single", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.query;    
    if (!documentId) {
      return res.status(400).json({ error: "Missing documentId" });
    }

    const document = await Documents.findOneByDocumentId(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const issuerDocStore = document.issuerDocStore;
    const signerDocStore = document.signerDocStore;
    console.log(issuerDocStore);
    const issuer = await User.findOne({ documentStoreAddress: issuerDocStore }).select('-password');
    console.log(issuer);
    if (!issuer) {
      return res.status(404).json({ error: "Issuer not found" });
    }

    const signer = await User.findOneByDocStore(signerDocStore);
    if (!signer) {
      return res.status(404).json({ error: "Signer not found" });
    }
    const signerRecord = getSignerByUserType(signer.userType);

    const documentIdHash = toBytes32(documentId);
    const documentStoreRead = new ethers.Contract(
      issuerDocStore,
      DocumentStoreABI,
      provider
    );
    const bytes32DocumentId = ethers.id(documentId);
    const meta = await documentStoreRead.meta(bytes32DocumentId);

    const wrappedDocument = document.wrappedDocInfo;
    const local = verifyWrappedMerkle(JSON.parse(wrappedDocument));
    if (!local.ok) {
      return res
        .status(400)
        .json({ error: "Failed to verify document", details: local.reason });
    }

    const computedHex32 = "0x" + local.computedRoot.toLowerCase();
    const hashMatches = meta.documentHash.toLowerCase() === computedHex32;

    const isIssued = await documentStoreRead.isIssued(documentIdHash);
    const signedAt = await documentStoreRead.signedAt(documentIdHash, signerRecord);
    
    // Extract revokedAt from meta (0 if not revoked)
    const revokedAt = meta.revokedAt.toString();

    res.status(200).json({
      message: "✅ Document found",
      document: {
        ...document.toObject(),
        issuer: issuer.toObject(),
        issued: isIssued,
        signedAt: signedAt.toString(),
        revokedAt: revokedAt,
        verified: isIssued && hashMatches,
      },
    });
  } catch (err) {
    console.error("❌ Error getting document:", err);
    res.status(500).json({ error: "Failed to get document", details: err.message });
  }
});

// Admin endpoints for user management
// Get all pending users (admin only)
app.get("/admin/pending-users", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin privileges required."
      });
    }

    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    
    res.status(200).json({
      message: "✅ Pending users retrieved successfully",
      users: pendingUsers
    });
  } catch (err) {
    console.error("❌ Error getting pending users:", err);
    res.status(500).json({
      error: "Failed to get pending users",
      details: err.message
    });
  }
});

// Get all users (admin only)
app.get("/admin/users", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin privileges required."
      });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "✅ All users retrieved successfully",
      users: users
    });
  } catch (err) {
    console.error("❌ Error getting all users:", err);
    res.status(500).json({
      error: "Failed to get users",
      details: err.message
    });
  }
});

// Approve user account (admin only)
app.put("/admin/users/:userId/approve", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin privileges required."
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    user.status = 'approved';
    await user.save();

    res.status(200).json({
      message: "✅ User approved successfully",
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error("❌ Error approving user:", err);
    res.status(500).json({
      error: "Failed to approve user",
      details: err.message
    });
  }
});

// Reject user account (admin only)
app.put("/admin/users/:userId/reject", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin privileges required."
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    user.status = 'rejected';
    await user.save();

    res.status(200).json({
      message: "✅ User rejected successfully",
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error("❌ Error rejecting user:", err);
    res.status(500).json({
      error: "Failed to reject user",
      details: err.message
    });
  }
});

// Get all documents (admin only - read-only access)
app.get("/admin/documents", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        error: "Access denied. Admin privileges required."
      });
    }

    const documents = await Documents.find({}).sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "✅ All documents retrieved successfully",
      documents: documents
    });
  } catch (err) {
    console.error("❌ Error getting all documents:", err);
    res.status(500).json({
      error: "Failed to get documents",
      details: err.message
    });
  }
});

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (sig) => {
      console.log(`\nReceived ${sig}. Shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    ["SIGINT", "SIGTERM"].forEach((sig) =>
      process.on(sig, () => shutdown(sig))
    );
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
})();
