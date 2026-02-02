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
export PLACEHOLDER_EMAIL_DOMAIN="vagabond.in"
export FIREBASE_PROJECT_ID="ajaimemory"
```

If you prefer to use your gcloud login instead of a service account,
run `gcloud auth application-default login` and the script will use ADC.

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
- You can override the placeholder domain with `PLACEHOLDER_EMAIL_DOMAIN`
- Creates `/users/{uid}` with `status: "approved"`
- Creates `posts` with `status: "approved"` and uploads media to Storage
- Writes `docs/auth-accounts.csv` with generated credentials

## Re-running safely
The script now:
- Sets `importKey`/`importSource` on imported posts
- Skips entries already imported
- Uses deterministic IDs for media uploads

This makes it safe to retry if a previous run timed out.

## After import
When real users sign in with Google/Apple, link their provider to the existing
email/password user in Firebase Auth so they keep the same UID.
