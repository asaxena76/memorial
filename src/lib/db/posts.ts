import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { postSchema, type Post } from "@/lib/models/post";

export type PostWithId = Post & { id: string };

function parsePost(docId: string, data: unknown): PostWithId | null {
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) return null;
  return { ...parsed.data, id: docId };
}

export async function getPostById(postId: string): Promise<PostWithId | null> {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return null;
  return parsePost(snap.id, snap.data());
}

export async function listApprovedPosts(max = 50): Promise<PostWithId[]> {
  const q = query(
    collection(db, "posts"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => parsePost(docSnap.id, docSnap.data()))
    .filter((post): post is PostWithId => Boolean(post));
}

export async function listPendingPosts(max = 50): Promise<PostWithId[]> {
  const q = query(
    collection(db, "posts"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => parsePost(docSnap.id, docSnap.data()))
    .filter((post): post is PostWithId => Boolean(post));
}

export async function listAllPosts(max = 200): Promise<PostWithId[]> {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => parsePost(docSnap.id, docSnap.data()))
    .filter((post): post is PostWithId => Boolean(post));
}

export async function listPostsByUser(uid: string): Promise<PostWithId[]> {
  const q = query(
    collection(db, "posts"),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((docSnap) => parsePost(docSnap.id, docSnap.data()))
    .filter((post): post is PostWithId => Boolean(post));
}
