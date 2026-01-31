import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { userProfileSchema, type UserProfile } from "@/lib/models/user";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const parsed = userProfileSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

export async function listPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => userProfileSchema.safeParse(docSnap.data()))
    .filter((result) => result.success)
    .map((result) => result.data);
}
