# Raj Group Location Master — Firebase Cloud Version

This version keeps the static master on GitHub Pages but saves Location1/2/3 updates and update history in Firebase Firestore, so all users/devices see the same committed locations.

## Firebase setup (one time)
1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web app and copy its Firebase config.
3. Open `firebase-config.js` and replace all `YOUR_...` values with that config.
4. Firebase Console → Authentication → Sign-in method → enable **Anonymous**.
5. Firebase Console → Firestore Database → Create database.
6. Firestore Rules: paste the contents of `firestore.rules` and Publish.
7. Upload all files in this folder to GitHub Pages.

## Important
- Firebase config for a web app is not a password/secret. Security is enforced by Firestore Rules.
- The current rules allow any authenticated anonymous user to read/write location updates. If you want only your staff to update, enable email/password authentication and tighten the rules.
- Location updates are stored per product in `locationUpdates`; every commit is recorded in `locationHistory`.
- The original compressed master files remain static on GitHub. They are not overwritten by users.
