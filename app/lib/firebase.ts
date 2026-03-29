import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const getDb = () => {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let credential;

    if (serviceAccountPath) {
      const absolutePath = resolve(process.cwd(), serviceAccountPath);
      const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf-8'));
      credential = admin.credential.cert(serviceAccount);
    } else if (serviceAccountJson) {
      credential = admin.credential.cert(JSON.parse(serviceAccountJson));
    } else {
      throw new Error(
        'Firebase: FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON requis',
      );
    }

    admin.initializeApp({ credential });
  }

  return admin.firestore();
};

export { getDb };
