import { z } from "zod";

export const userStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const userRoleSchema = z.enum(["admin", "member"]);

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  status: userStatusSchema,
  createdAt: z.any(),
  approvedAt: z.any().optional(),
  approvedBy: z.string().optional(),
  rejectedAt: z.any().optional(),
  rejectedBy: z.string().optional(),
  role: userRoleSchema.optional(),
});

export type UserStatus = z.infer<typeof userStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
