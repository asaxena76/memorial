import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/client";

export function approveUser(uid: string) {
  const call = httpsCallable(functions, "approveUser");
  return call({ uid });
}

export function rejectUser(uid: string, reason?: string) {
  const call = httpsCallable(functions, "rejectUser");
  return call({ uid, reason });
}

export function approvePost(postId: string) {
  const call = httpsCallable(functions, "approvePost");
  return call({ postId });
}

export function rejectPost(postId: string, reason?: string) {
  const call = httpsCallable(functions, "rejectPost");
  return call({ postId, reason });
}
