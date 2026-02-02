# Import memories into Firestore posts

This project uses a single `posts` collection for memories.  
Use the script below to import `docs/whatsapp-memories-filtered.md` into Firestore
and upload any referenced media into Storage.

## Requirements
- A Firebase service account JSON file
- Firebase Storage bucket name
- Python package: `firebase-admin`

## Environment
```
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export FIREBASE_STORAGE_BUCKET="ajaimemory.firebasestorage.app"
```

## Install dependency
```
python -m pip install firebase-admin
```

## Run import
```
python scripts/import-memories-to-posts.py
```

## Output
- Creates email/password users for each author (placeholder domain `ajaimemory.local`)
- Creates `/users/{uid}` with `status: "approved"`
- Creates `posts` with `status: "approved"` and uploads media to Storage
- Writes `docs/auth-accounts.csv` with generated credentials

## After import
When real users sign in with Google/Apple, link their provider to the existing
email/password user in Firebase Auth so they keep the same UID.

