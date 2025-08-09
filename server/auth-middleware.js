import admin from './firebase-admin.js';

export const authenticateToken = async (req, res, next) => {
  // Skip authentication if Firebase Admin is not initialized
  if (!admin.apps.length) {
    console.warn('Firebase Admin not initialized, skipping authentication');
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  // Skip authentication if Firebase Admin is not initialized
  if (!admin.apps.length) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't fail the request, just don't set req.user
    }
  }
  
  next();
};
