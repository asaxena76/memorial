# Deployment

## Recommended: Firebase App Hosting
1. Enable **App Hosting** in the Firebase console.
2. Connect this GitHub repo.
3. Set environment variables listed in `docs/FIREBASE_SETUP.md`.
4. Deploy on push.

## Alternative: Firebase Hosting (framework integration)
1. Run `firebase init hosting` and select **Next.js**.
2. Choose the same project used for Firestore/Storage/Functions.
3. Deploy with `firebase deploy`.

Firebase will deploy dynamic Next.js routes as functions automatically.
