import { getBlob, getDownloadURL, ref } from "firebase/storage";

import { storage } from "@/lib/firebase/client";

export async function getImageObjectUrl(storagePath: string) {
  const blob = await getBlob(ref(storage, storagePath));
  return URL.createObjectURL(blob);
}

export async function getVideoUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}
