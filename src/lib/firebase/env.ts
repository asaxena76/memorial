type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
  messagingSenderId?: string;
  measurementId?: string;
};

const firebaseClientConfig: FirebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function getFirebaseClientConfig(): FirebaseClientConfig {
  return firebaseClientConfig;
}

export function assertFirebaseEnv() {
  const missing: string[] = [];
  if (!firebaseClientConfig.apiKey)
    missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseClientConfig.authDomain)
    missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseClientConfig.projectId)
    missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseClientConfig.storageBucket)
    missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseClientConfig.appId)
    missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(", ")}. ` +
        "Add them to .env.local or your hosting provider."
    );
  }
}
