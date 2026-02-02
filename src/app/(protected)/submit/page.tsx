"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase/client";
import { createPostId, uploadPostFile } from "@/lib/storage/upload";
import { getImageMetadata, getVideoMetadata } from "@/lib/media/metadata";
import type { PostMedia } from "@/lib/models/post";
import { RequireAuth } from "@/components/auth/require-auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const schema = z.object({
  caption: z.string().min(2, "Please add a short caption.").max(500),
  files: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Select at least one file.")
    .refine(
      (files) =>
        Array.from(files ?? []).every((file) => file.size <= MAX_FILE_SIZE),
      "One or more files exceed 50MB."
    )
    .refine(
      (files) =>
        Array.from(files ?? []).every(
          (file) =>
            file.type.startsWith("image/") || file.type === "video/mp4"
        ),
      "Only images or MP4 videos are allowed."
    ),
});

type FormValues = z.infer<typeof schema>;

export default function SubmitPage() {
  const { user, profile } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      caption: "",
    },
  });

  const files = useWatch({ control, name: "files" });
  const fileList = Array.from(files ?? []);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    try {
      const postId = createPostId();
      const media: PostMedia[] = [];

      for (const file of fileList) {
        const metadata = file.type.startsWith("image/")
          ? await getImageMetadata(file)
          : await getVideoMetadata(file);

        const upload = await uploadPostFile({
          uid: user.uid,
          postId,
          file,
          onProgress: (progress) =>
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            })),
        });

        media.push({
          kind: file.type.startsWith("image/") ? "image" : "video",
          storagePath: upload.storagePath,
          contentType: upload.contentType,
          sizeBytes: upload.sizeBytes,
          ...(metadata ?? {}),
        });
      }

      await setDoc(doc(db, "posts", postId), {
        createdBy: user.uid,
        authorName: profile?.displayName || user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "pending",
        caption: values.caption,
        media,
      });

      toast.success("Submission sent for approval.");
      reset();
      setUploadProgress({});
    } catch (error) {
      console.error(error);
      toast.error("Could not submit your memory.");
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl">
        <h2 className="font-serif text-2xl">Share a memory</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload photos or short videos that honor the memorial. Submissions are
          reviewed before they appear.
        </p>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="caption">
              Caption
            </label>
            <textarea
              id="caption"
              className="min-h-[120px] rounded-2xl border border-border/70 bg-background/80 p-3 text-sm"
              placeholder="Share a short memory or context."
              {...register("caption")}
            />
            {errors.caption ? (
              <p className="text-xs text-destructive">
                {errors.caption.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="files">
              Photos or video (MP4)
            </label>
            <input
              id="files"
              type="file"
              accept="image/*,video/mp4"
              multiple
              {...register("files")}
            />
            {errors.files ? (
              <p className="text-xs text-destructive">{errors.files.message}</p>
            ) : null}
          </div>

          {fileList.length > 0 && (
            <div className="grid gap-3">
              {fileList.map((file) => (
                <div
                  key={file.name}
                  className="rounded-2xl border border-border/60 bg-card/70 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">
                      {Math.round(file.size / 1024)} KB
                    </span>
                  </div>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition"
                        style={{
                          width: `${Math.round(
                            uploadProgress[file.name] * 100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit for review"}
          </Button>
        </form>
      </div>
    </RequireAuth>
  );
}
