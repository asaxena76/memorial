import { getDownloadURL, ref } from "firebase/storage";

import { storage } from "@/lib/firebase/client";

export async function getImageUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}

export async function getVideoUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}
