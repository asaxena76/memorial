import { doc, collection } from "firebase/firestore";
import { ref, uploadBytesResumable } from "firebase/storage";

import { db, storage } from "@/lib/firebase/client";

export function createPostId() {
  return doc(collection(db, "posts")).id;
}

export async function uploadPostFile({
  uid,
  postId,
  file,
  onProgress,
}: {
  uid: string;
  postId: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const storagePath = `uploads/${uid}/${postId}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  return new Promise<{
    storagePath: string;
    contentType: string;
    sizeBytes: number;
  }>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    });

    task.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes
          ? snapshot.bytesTransferred / snapshot.totalBytes
          : 0;
        onProgress?.(progress);
      },
      (error) => reject(error),
      () => {
        resolve({
          storagePath,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }
    );
  });
}
