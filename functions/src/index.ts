import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { auth } from "firebase-functions/v1";

admin.initializeApp();

const db = admin.firestore();
const initialAdminEmails = defineString("INITIAL_ADMIN_EMAILS", {
  default: "",
});

function parseAdminEmails() {
  return initialAdminEmails
    .value()
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function requireAdmin(authContext?: { token?: Record<string, unknown> }) {
  if (!authContext?.token?.admin) {
    throw new HttpsError("permission-denied", "Admin privileges required.");
  }
}

async function writeAuditLog(entry: {
  action: string;
  actorUid: string;
  targetUid?: string;
  targetPostId?: string;
  meta?: Record<string, unknown>;
}) {
  await db.collection("auditLogs").add({
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const handleUserCreate = auth.user().onCreate(async (user) => {
  const adminEmails = parseAdminEmails();
  const isBootstrapAdmin =
    user.email && adminEmails.includes(user.email.toLowerCase());

  const status = isBootstrapAdmin ? "approved" : "pending";
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("users").doc(user.uid).set({
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    status,
    role: isBootstrapAdmin ? "admin" : "member",
    createdAt: now,
    ...(isBootstrapAdmin
      ? {
          approvedAt: now,
          approvedBy: user.uid,
        }
      : {}),
  });

  if (isBootstrapAdmin) {
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      approved: true,
    });
  }
});

const callableOptions = { invoker: "public" as const };

export const approveUser = onCall(callableOptions, async (request) => {
  requireAdmin(request.auth ?? undefined);
  const uid = request.data?.uid as string | undefined;
  if (!uid) {
    throw new HttpsError("invalid-argument", "uid is required");
  }

  const userRecord = await admin.auth().getUser(uid);
  const currentClaims = userRecord.customClaims ?? {};

  await admin.auth().setCustomUserClaims(uid, {
    ...currentClaims,
    approved: true,
  });

  await db.collection("users").doc(uid).set(
    {
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: request.auth?.uid ?? "",
      role: currentClaims.admin ? "admin" : "member",
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "APPROVE_USER",
    actorUid: request.auth?.uid ?? "",
    targetUid: uid,
  });

  return { ok: true };
});

export const rejectUser = onCall(callableOptions, async (request) => {
  requireAdmin(request.auth ?? undefined);
  const uid = request.data?.uid as string | undefined;
  const reason = request.data?.reason as string | undefined;
  if (!uid) {
    throw new HttpsError("invalid-argument", "uid is required");
  }

  const userRecord = await admin.auth().getUser(uid);
  const currentClaims = userRecord.customClaims ?? {};

  await admin.auth().setCustomUserClaims(uid, {
    ...currentClaims,
    approved: false,
  });

  await db.collection("users").doc(uid).set(
    {
      status: "rejected",
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: request.auth?.uid ?? "",
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "REJECT_USER",
    actorUid: request.auth?.uid ?? "",
    targetUid: uid,
    meta: reason ? { reason } : undefined,
  });

  return { ok: true };
});

export const approvePost = onCall(callableOptions, async (request) => {
  requireAdmin(request.auth ?? undefined);
  const postId = request.data?.postId as string | undefined;
  if (!postId) {
    throw new HttpsError("invalid-argument", "postId is required");
  }

  await db.collection("posts").doc(postId).set(
    {
      status: "approved",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: request.auth?.uid ?? "",
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "APPROVE_POST",
    actorUid: request.auth?.uid ?? "",
    targetPostId: postId,
  });

  return { ok: true };
});

export const rejectPost = onCall(callableOptions, async (request) => {
  requireAdmin(request.auth ?? undefined);
  const postId = request.data?.postId as string | undefined;
  const reason = request.data?.reason as string | undefined;
  if (!postId) {
    throw new HttpsError("invalid-argument", "postId is required");
  }

  await db.collection("posts").doc(postId).set(
    {
      status: "rejected",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: request.auth?.uid ?? "",
      rejectedReason: reason ?? "",
    },
    { merge: true }
  );

  await writeAuditLog({
    action: "REJECT_POST",
    actorUid: request.auth?.uid ?? "",
    targetPostId: postId,
    meta: reason ? { reason } : undefined,
  });

  return { ok: true };
});
