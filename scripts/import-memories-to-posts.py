#!/usr/bin/env python3
import json
import mimetypes
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from secrets import choice

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage

SOURCE_PATH = Path("docs/whatsapp-memories-filtered.md")
ACCOUNTS_CSV = Path("docs/auth-accounts.csv")
ACCOUNTS_MD = Path("docs/auth-accounts.md")

QUOTE_RE = re.compile(r"^- Quote \(([^)]+)\):\s*(.*)$")


def parse_quotes(lines):
    entries = []
    current_author = None
    current = None

    def flush():
        nonlocal current
        if current and current.get("text"):
            current["text"] = current["text"].strip()
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
        raise SystemExit("Set FIREBASE_STORAGE_BUCKET (e.g. ajaimemory.firebasestorage.app)")

    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        raise SystemExit("Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON")

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})

    db = firestore.client()
    bucket = storage.bucket()

    lines = SOURCE_PATH.read_text(encoding="utf-8").splitlines()
    entries = parse_quotes(lines)

    authors = sorted({e["author"] for e in entries}, key=lambda s: s.lower())
    used_emails = {}
    account_rows = []
    author_map = {}

    for author in authors:
        local = slugify(author)
        email = f"{local}@ajaimemory.local"
        if email in used_emails:
            used_emails[email] += 1
            email = f"{local}{used_emails[email]}@ajaimemory.local"
        else:
            used_emails[email] = 1
        password = make_password()
        account_rows.append((author, email, password))

        user = ensure_user(email, password, author)
        author_map[author] = {
            "uid": user.uid,
            "email": email,
            "displayName": author,
        }

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

    for entry in entries:
        author_info = author_map[entry["author"]]
        uid = author_info["uid"]

        date_str = entry.get("date") or ""
        created_at = firestore.SERVER_TIMESTAMP
        if date_str:
            try:
                created_at = datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                created_at = firestore.SERVER_TIMESTAMP

        media_items = []
        for path in entry.get("media", []):
            file_path = Path(path)
            if not file_path.exists():
                continue
            content_type, _ = mimetypes.guess_type(str(file_path))
            content_type = content_type or "application/octet-stream"

            post_id = db.collection("posts").document().id
            storage_path = f"uploads/{uid}/imported/{post_id}/{file_path.name}"
            blob = bucket.blob(storage_path)
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

        post_ref = db.collection("posts").document()
        post_ref.set(
            {
                "createdBy": uid,
                "createdAt": created_at,
                "status": "approved",
                "reviewedAt": created_at,
                "reviewedBy": "system",
                "caption": entry.get("text") or "",
                "media": media_items,
            }
        )

    print(f"Imported {len(entries)} entries into Firestore posts.")


if __name__ == "__main__":
    main()
