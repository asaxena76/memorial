#!/usr/bin/env python3
import json
import mimetypes
import os
import re
import unicodedata
import hashlib
from datetime import datetime
from pathlib import Path
from secrets import choice

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

SOURCE_PATH = Path("docs/whatsapp-memories-filtered.md")
ACCOUNTS_CSV = Path("docs/auth-accounts.csv")
ACCOUNTS_MD = Path("docs/auth-accounts.md")

QUOTE_RE = re.compile(r"^- Quote \(([^)]+)\):\s*(.*)$")


def clean_text(text: str) -> str:
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("- "):
            line = line[2:].strip()
        elif line.startswith("• "):
            line = line[2:].strip()
        elif line.startswith("– "):
            line = line[2:].strip()
        lines.append(line)

    # collapse excessive blank lines
    cleaned = []
    blank = 0
    for line in lines:
        if line == "":
            blank += 1
            if blank > 2:
                continue
        else:
            blank = 0
        cleaned.append(line)

    return "\n".join(cleaned).strip()

def make_import_key(author: str, date_str: str, text: str) -> str:
    base = f"{author}|{date_str}|{text}"
    return hashlib.sha1(base.encode("utf-8")).hexdigest()


def parse_quotes(lines):
    entries = []
    current_author = None
    current = None

    def flush():
        nonlocal current
        if current and current.get("text"):
            current["text"] = clean_text(current["text"])
            entries.append(current)
        current = None

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("## "):
            flush()
            current_author = line[3:].strip()
            continue

        if not current_author:
            continue

        if line.startswith("- Quote "):
            flush()
            match = QUOTE_RE.match(line)
            if not match:
                continue
            date, text = match.groups()
            current = {
                "author": current_author,
                "date": date.strip(),
                "text": text.strip(),
                "media": [],
            }
            continue

        if line.startswith("  - Media:"):
            continue

        if line.startswith("    - `") and line.endswith("`"):
            if current is None:
                continue
            path = line[len("    - `") : -1]
            current["media"].append(path)
            continue

        if line.startswith("- "):
            content = line[2:].strip()
            if current is None:
                current = {
                    "author": current_author,
                    "date": "",
                    "text": content,
                    "media": [],
                }
            else:
                if current["text"]:
                    current["text"] += "\n" + content
                else:
                    current["text"] = content
            continue

        if line.strip() == "":
            if current is not None and current["text"]:
                current["text"] += "\n"
            continue

        if current is None:
            current = {
                "author": current_author,
                "date": "",
                "text": line.strip(),
                "media": [],
            }
        else:
            current["text"] += "\n" + line.strip()

    flush()
    return entries


def slugify(name: str) -> str:
    name = name.strip().lower()
    name = unicodedata.normalize("NFKD", name)
    name = "".join(ch for ch in name if not unicodedata.combining(ch))
    name = re.sub(r"[^a-z0-9]+", ".", name)
    name = re.sub(r"\.+", ".", name).strip(".")
    return name or "user"


def make_password(length=12):
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
    return "".join(choice(alphabet) for _ in range(length))


def ensure_user(user_email, password, display_name):
    try:
        user = auth.get_user_by_email(user_email)
    except auth.UserNotFoundError:
        user = auth.create_user(
            email=user_email,
            password=password,
            display_name=display_name,
        )
    return user


def main():
    if not SOURCE_PATH.exists():
        raise SystemExit(f"Missing source file: {SOURCE_PATH}")

    bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET")
    if not bucket_name:
        for env_path in (".env.local", ".env.production", ".env.ajaimemory", ".env"):
            if not Path(env_path).exists():
                continue
            for line in Path(env_path).read_text(encoding="utf-8").splitlines():
                if line.startswith("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="):
                    bucket_name = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
            if bucket_name:
                break
    if not bucket_name:
        raise SystemExit("Set FIREBASE_STORAGE_BUCKET (e.g. ajaimemory.firebasestorage.app)")

    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    print("Initializing Firebase Admin...", flush=True)
    if cred_path:
        print(f"Using service account: {cred_path}", flush=True)
        cred = credentials.Certificate(cred_path)
    else:
        print("Using Application Default Credentials (gcloud).", flush=True)
        cred = credentials.ApplicationDefault()

    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GCLOUD_PROJECT")
    if not project_id:
        for env_path in (".env.local", ".env.production", ".env.ajaimemory", ".env"):
            if not Path(env_path).exists():
                continue
            for line in Path(env_path).read_text(encoding="utf-8").splitlines():
                if line.startswith("NEXT_PUBLIC_FIREBASE_PROJECT_ID="):
                    project_id = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
            if project_id:
                break

    if not project_id:
        raise SystemExit("Set FIREBASE_PROJECT_ID (e.g. ajaimemory)")

    firebase_admin.initialize_app(
        cred,
        {"storageBucket": bucket_name, "projectId": project_id},
    )
    print(f"Using project: {project_id}", flush=True)
    print(f"Connected to bucket: {bucket_name}", flush=True)

    db = firestore.client()
    bucket = storage.bucket()

    print(f"Loading source file: {SOURCE_PATH}", flush=True)
    lines = SOURCE_PATH.read_text(encoding="utf-8").splitlines()
    entries = parse_quotes(lines)
    print(f"Parsed {len(entries)} memory entries.", flush=True)

    email_domain = os.environ.get("PLACEHOLDER_EMAIL_DOMAIN", "vagabond.in")

    authors = sorted({e["author"] for e in entries}, key=lambda s: s.lower())
    used_emails = {}
    account_rows = []
    author_map = {}

    print(f"Creating/loading {len(authors)} author accounts...", flush=True)
    for idx, author in enumerate(authors, start=1):
        local = slugify(author)
        email = f"{local}@{email_domain}"
        if email in used_emails:
            used_emails[email] += 1
            email = f"{local}{used_emails[email]}@{email_domain}"
        else:
            used_emails[email] = 1
        password = make_password()
        account_rows.append((author, email, password))

        try:
            user = ensure_user(email, password, author)
        except Exception as exc:
            print(f"[ERROR] Failed user {author} ({email}): {exc}", flush=True)
            raise
        author_map[author] = {
            "uid": user.uid,
            "email": email,
            "displayName": author,
        }
        if idx % 5 == 0 or idx == len(authors):
            print(f"  - processed {idx}/{len(authors)} users", flush=True)

        # ensure user profile doc exists and is approved
        user_ref = db.collection("users").document(user.uid)
        if not user_ref.get().exists:
            user_ref.set(
                {
                    "uid": user.uid,
                    "email": email,
                    "displayName": author,
                    "photoURL": None,
                    "status": "approved",
                    "createdAt": firestore.SERVER_TIMESTAMP,
                    "approvedAt": firestore.SERVER_TIMESTAMP,
                    "approvedBy": "system",
                    "role": "member",
                }
            )

        # set approved claim if missing
        auth.set_custom_user_claims(user.uid, {"approved": True})

    # write accounts files
    with ACCOUNTS_CSV.open("w", encoding="utf-8") as f:
        f.write("name,email,password\n")
        for name, email, password in account_rows:
            f.write(f"{name},{email},{password}\n")

    with ACCOUNTS_MD.open("w", encoding="utf-8") as f:
        f.write("# Auth Accounts (Email/Password)\n\n")
        f.write(
            "Generated placeholder login credentials for authors in "
            "`whatsapp-memories-filtered.md`.\n"
        )
        f.write("These emails use the placeholder domain `ajaimemory.local`.\n\n")
        f.write("Create these in Firebase Auth (Email/Password) via Admin SDK.\n")
        f.write("Later, link the real Google/Apple account to the same user.\n\n")
        f.write("CSV file: `docs/auth-accounts.csv`\n")

    print("Checking for already imported posts...", flush=True)
    existing_keys = set()
    # Backfill importKey for posts created by placeholder users
    for author in authors:
        uid = author_map[author]["uid"]
        for doc_snap in (
            db.collection("posts")
            .where("createdBy", "==", uid)
            .stream()
        ):
            data = doc_snap.to_dict() or {}
            caption = data.get("caption", "")
            created_at = data.get("createdAt")
            date_str = ""
            if hasattr(created_at, "date"):
                date_str = created_at.date().isoformat()
            import_key = data.get("importKey")
        if not import_key and caption:
            import_key = make_import_key(author, date_str, clean_text(caption))
            doc_snap.reference.update(
                {
                    "importKey": import_key,
                    "importSource": "whatsapp",
                }
            )
        if caption and not data.get("authorName"):
            doc_snap.reference.update(
                {
                    "authorName": author,
                }
            )
        if import_key:
            existing_keys.add(import_key)

    print(f"Found {len(existing_keys)} existing imported posts.", flush=True)

    print("Importing posts and uploading media...", flush=True)
    for idx, entry in enumerate(entries, start=1):
        author_info = author_map[entry["author"]]
        uid = author_info["uid"]

        date_str = entry.get("date") or ""
        created_at = firestore.SERVER_TIMESTAMP
        if date_str:
            try:
                created_at = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                created_at = firestore.SERVER_TIMESTAMP

        entry_text = clean_text(entry.get("text") or "")
        import_key = make_import_key(entry["author"], date_str, entry_text)
        if import_key in existing_keys:
            if idx % 10 == 0:
                print(f"  - skipped {idx}/{len(entries)} posts (already imported)", flush=True)
            continue

        doc_id = f"import-{import_key[:18]}"
        media_items = []
        for path in entry.get("media", []):
            file_path = Path(path)
            if not file_path.exists():
                print(f"  [warn] missing media: {file_path}", flush=True)
                continue
            content_type, _ = mimetypes.guess_type(str(file_path))
            content_type = content_type or "application/octet-stream"

            storage_path = f"uploads/{uid}/imported/{doc_id}/{file_path.name}"
            blob = bucket.blob(storage_path)
            if blob.exists():
                print(
                    f"  [{idx}/{len(entries)}] exists {file_path.name} -> {storage_path}",
                    flush=True,
                )
            else:
                print(
                    f"  [{idx}/{len(entries)}] uploading {file_path.name} -> {storage_path}",
                    flush=True,
                )
                blob.upload_from_filename(str(file_path), content_type=content_type)
                blob.cache_control = "public, max-age=31536000, immutable"
                blob.patch()

            media_items.append(
                {
                    "kind": "video" if content_type.startswith("video/") else "image",
                    "storagePath": storage_path,
                    "contentType": content_type,
                    "sizeBytes": file_path.stat().st_size,
                }
            )

        post_ref = db.collection("posts").document(doc_id)
        post_ref.set(
            {
                "createdBy": uid,
                "authorName": entry["author"],
                "createdAt": created_at,
                "status": "approved",
                "reviewedAt": created_at,
                "reviewedBy": "system",
                "caption": entry_text,
                "media": media_items,
                "importKey": import_key,
                "importSource": "whatsapp",
            }
        )
        if idx % 5 == 0 or idx == len(entries):
            print(f"  - imported {idx}/{len(entries)} posts", flush=True)

    print(f"Imported {len(entries)} entries into Firestore posts.", flush=True)


if __name__ == "__main__":
    main()
