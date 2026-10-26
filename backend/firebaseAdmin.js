
const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error(
    "Firebase Admin credentials missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env"
  );
}

const privateKey = rawPrivateKey
  .replace(/^["']|["']$/g, "")
  .replace(/\\n/g, "\n");

if (
  !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
  !privateKey.includes("-----END PRIVATE KEY-----")
) {
  throw new Error(
    "Firebase private key format is invalid. Check FIREBASE_PRIVATE_KEY in backend/.env"
  );
}

const serviceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

const auth = getAuth(app);

module.exports = {
  app,
  auth: () => auth,
};
