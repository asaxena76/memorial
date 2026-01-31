"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

import { assertFirebaseEnv, getFirebaseClientConfig } from "./env";

assertFirebaseEnv();

const config = getFirebaseClientConfig();

const firebaseApp: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(config);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const functions = getFunctions(firebaseApp, "us-central1");

export { firebaseApp, auth, db, storage, functions };
