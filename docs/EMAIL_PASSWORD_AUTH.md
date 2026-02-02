# Email/Password Accounts

To support users without Google accounts, the login page now includes email/password sign-in.

## 1) Enable provider
In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.

## 2) Create placeholder accounts
Generated credentials live in `docs/auth-accounts.csv` (ignored by git because it contains passwords).
The placeholder email domain comes from `PLACEHOLDER_EMAIL_DOMAIN` (default `vagabond.in`).

You can create accounts in Firebase Auth using:
- **Console** → Authentication → Users → Add user (manual), or
- **Admin SDK** (bulk import via a script).

## 3) Link real Google accounts later
When a user later signs in with Google/Apple, link that provider to the existing
email/password user in Firebase Auth so they keep the same UID.
