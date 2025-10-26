const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  organisationId: {
    type: String,
    required: true
  },
  documentStoreAddress: {
    type: String,
    required: false // Will be set after document store creation
  },
  userType: {
    type: String,
    enum: ['admin', 'sales', 'purchase', 'invoice'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    this.updatedAt = Date.now();
    return next();
  }

  try {
    // Hash password with cost of 12 (higher = more secure but slower)
    // Cost 12 is recommended for production (takes ~300ms to hash)
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find user by email
userSchema.statics.findOneByEmail = async function(email) {
  try {
    const user = await this.findOne({ email: email.toLowerCase().trim() });
    return user;
  } catch (error) {
    throw new Error(`Error finding user by email: ${error.message}`);
  }
};

// Static method to find user by email
userSchema.statics.findOneByDocStore = async function(docStore) {
    try {
      const user = await this.findOne({ documentStoreAddress: docStore.trim() });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  };

// Instance method to update document store address
userSchema.methods.updateDocumentStoreAddress = async function(address) {
  this.documentStoreAddress = address;
  return await this.save();
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Error comparing password: ${error.message}`);
  }
};

// Instance method to get user without sensitive data
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
