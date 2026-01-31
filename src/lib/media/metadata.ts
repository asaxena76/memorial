export async function getImageMetadata(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return { width: image.width, height: image.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function getVideoMetadata(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video metadata"));
    });
    return { durationSec: Math.round(video.duration) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
