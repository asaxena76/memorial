#!/usr/bin/env python3
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


def read_env_project():
    for env_path in (".env.local", ".env.production", ".env.ajaimemory", ".env"):
        if not Path(env_path).exists():
            continue
        for line in Path(env_path).read_text(encoding="utf-8").splitlines():
            if line.startswith("NEXT_PUBLIC_FIREBASE_PROJECT_ID="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def main():
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path:
        cred = credentials.Certificate(cred_path)
    else:
        cred = credentials.ApplicationDefault()

    project_id = (
        os.environ.get("FIREBASE_PROJECT_ID")
        or os.environ.get("GCLOUD_PROJECT")
        or read_env_project()
    )
    if not project_id:
        raise SystemExit("Set FIREBASE_PROJECT_ID (e.g. ajaimemory)")

    firebase_admin.initialize_app(cred, {"projectId": project_id})
    db = firestore.client()

    # Build uid -> displayName map
    user_map = {}
    for snap in db.collection("users").stream():
        data = snap.to_dict() or {}
        name = data.get("displayName")
        if name:
            user_map[snap.id] = name

    missing = []
    for snap in db.collection("posts").stream():
        data = snap.to_dict() or {}
        if data.get("authorName"):
            continue
        created_by = data.get("createdBy")
        if created_by and created_by in user_map:
            missing.append((snap.reference, user_map[created_by]))

    if not missing:
        print("No posts missing authorName.")
        return

    batch = db.batch()
    count = 0
    for ref, name in missing:
        batch.update(ref, {"authorName": name})
        count += 1
        if count % 450 == 0:
            batch.commit()
            batch = db.batch()

    batch.commit()
    print(f"Backfilled authorName on {count} posts.")


if __name__ == "__main__":
    main()
