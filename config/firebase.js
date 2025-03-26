const admin = require('firebase-admin');

// You would typically load this from an environment variable
// or a JSON file that is not committed to version control
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse the service account from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Fix the private key format if needed
    // When stored in environment variables, newlines in the private key are often escaped
    if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else {
    // Fallback to placeholder if no environment variable
    serviceAccount = {
      // This is just a placeholder. In a real app, you would use your own Firebase service account.
      "type": "service_account",
      "project_id": "your-project-id",
      "private_key_id": "your-private-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
      "client_email": "your-client-email",
      "client_id": "your-client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "your-cert-url"
    };
  }
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
  process.exit(1);
}

// Get database URL from environment variables
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://your-project-id.firebaseio.com';

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit the process as the app can't function without Firebase
}

// Get the database instance
const db = admin.database();

module.exports = {
  admin,
  db
}; 