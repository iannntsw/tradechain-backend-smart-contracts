const jwt = require('jsonwebtoken');

// JWT secret key - in production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // Token expires in 24 hours

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    userType: user.userType,
    organisationId: user.organisationId
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'document-management-system',
    audience: 'document-management-api'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'document-management-system',
      audience: 'document-management-api'
    });
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware to authenticate requests using JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid Bearer token in the Authorization header'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Add user info to request object
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  authenticateToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
