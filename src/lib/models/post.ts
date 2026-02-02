import { z } from "zod";

export const postStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const mediaKindSchema = z.enum(["image", "video"]);

export const postMediaSchema = z.object({
  kind: mediaKindSchema,
  storagePath: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  durationSec: z.number().optional(),
  thumbnailPath: z.string().optional(),
});

export const postSchema = z.object({
  createdBy: z.string(),
  authorName: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any().optional(),
  status: postStatusSchema,
  reviewedAt: z.any().optional(),
  reviewedBy: z.string().optional(),
  rejectedReason: z.string().optional(),
  caption: z.string(),
  media: z.array(postMediaSchema),
});

export const createPostSchema = z.object({
  caption: z.string().min(2).max(500),
  media: z.array(postMediaSchema).min(1),
});

export type PostStatus = z.infer<typeof postStatusSchema>;
export type PostMedia = z.infer<typeof postMediaSchema>;
export type Post = z.infer<typeof postSchema>;
