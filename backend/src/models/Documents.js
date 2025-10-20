const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    trim: true,
  },
  documentType: {
    type: String,
    enum: ["SALES-QUOTE", "INVOICE", "PAYMENT-ORDER", "DELIVERY-ORDER"],
    required: true,
  },
  documentHash: {
    type: String,
    required: true,
  },
  quoteNumber: {
    type: String,
    required: true,
  },
  rawDocInfo: {
    type: String,
    required: true,
  },
  wrappedDocInfo: {
    type: String,
    required: true,
  },
  issuerDocStore: {
    type: String,
    required: true,
  },
  signerDocStore: {
    type: String,
    required: true,
  },
  isSignable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.pre("save", async function (next) {
  this.updated = Date.now();

  if (!this.created) {
    this.created = this.updated;
  }

  next();
});

documentSchema.statics.findOneByDocumentId = async function (documentId) {
  try {
    const document = await this.findOne({
      documentId: documentId.trim(),
    });
    return document;
  } catch (error) {
    throw new Error(`Error finding document by documentId: ${error.message}`);
  }
};

documentSchema.statics.getAllDocuments = async function () {
  try {
    const documents = await this.find().select('-rawDocInfo -wrappedDocInfo');
    return documents;
  } catch (error) {
    throw new Error(`Error getting all documents: ${error.message}`);
  }
};

const Documents = mongoose.model("Documents", documentSchema);

module.exports = Documents;
