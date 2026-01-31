# Firebase setup (required)

## Client env vars
Create `.env.local` with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Only the first five are required by the app, but set them all to match your Firebase config.

## Auth providers
Enable providers in Firebase Auth:
- Google (required)
- Apple (optional)

Add authorized domains for your custom domain and `localhost`.

## Firestore + Storage
- Create Firestore and Storage in the region closest to your family.

## Storage CORS (for getBlob on images)
A default CORS file is provided at `docs/cors.json`. Update it if you add a custom domain.

Run (replace bucket if needed):

```
gsutil cors set docs/cors.json gs://ajaimemory.firebasestorage.app
```

## Bootstrap admin
Set function env var/secret:

```
INITIAL_ADMIN_EMAILS="you@example.com,other@example.com"
```

When a matching email signs in for the first time, it will be granted `admin` + `approved` claims automatically.

## Functions + Rules
Deploy these from the repo root:

```
firebase deploy --only functions,firestore,storage
```

## Local emulator (optional)
```
cd functions
npm install
npm run build
```

Then at repo root:
```
firebase emulators:start
```
