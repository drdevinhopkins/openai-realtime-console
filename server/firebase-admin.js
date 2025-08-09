import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// For development, you can use a service account key file
// For production, use environment variables or Google Cloud default credentials

let serviceAccount;
try {
  // Try to load service account from environment variable (for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // For development, you can use a service account key file
    // Make sure to add this file to .gitignore
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  }
} catch (error) {
  console.warn('Firebase service account not configured. Authentication will be disabled.');
  serviceAccount = null;
}

if (serviceAccount && Object.keys(serviceAccount).length > 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  });
} else {
  // Initialize without credentials for development (will disable auth)
  console.warn('Firebase Admin SDK not initialized. Authentication middleware will be disabled.');
}

export default admin;
