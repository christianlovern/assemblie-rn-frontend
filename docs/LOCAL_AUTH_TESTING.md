# Testing "Stay signed in" (session restore) locally

Use this to verify that after you log in, kill the app, and reopen it, you stay signed in and land on Organization Switcher — **without uploading to TestFlight**.

## Why use a development build (not Expo Go)

- **Expo Go**: Persistence (e.g. SecureStore) can behave differently than in a real install. For reliable "kill and reopen" testing, use a **development build**.
- **Development build**: Same native persistence as production, so session restore behaves like TestFlight/App Store.

## Steps

### 1. Start the app in dev

From the project root:

```bash
npm start
# or: npx expo start
```

Keep this terminal running.

### 2. Run a development build on a device or simulator

**iOS (simulator):**

```bash
npx expo run:ios
```

Or: press `i` in the Expo CLI terminal after `npm start` (if your app is configured to open in simulator).

**iOS (physical device):**

```bash
npx expo run:ios --device
```

**Android (emulator or device):**

```bash
npx expo run:android
```

Or: press `a` in the Expo CLI terminal.

This builds and installs the app once. After that you can open the app from the home screen; you can keep using `npm start` for JS reloads.

### 3. Watch logs

- **iOS**: Xcode console, or `npx expo start` and then run the app from Xcode / simulator so logs stream in the terminal.
- **Android**: `npx expo start` and run the app; Metro/Expo logs appear in the same terminal. Or use Android Studio Logcat and filter by your app / `[SessionRestore]`, `[TokenStorage]`, etc.

### 4. Reproduce "kill and reopen"

1. In the app, **log in** (email/password or your normal flow).
2. Confirm you see the main app (e.g. Organization Switcher / Home).
3. **Kill the app** (do not just background it):
   - **iOS**: Swipe up to open app switcher, then swipe the app away.
   - **Android**: Open recents and swipe the app away (or tap "Close" if shown).
4. **Reopen the app** from the home screen (cold start).

### 5. What to check

- **Expected**: You stay signed in and land on **Organization Switcher** (or main app).
- **If you’re sent back to login**: Check the console for the `[SessionRestore]`, `[TokenStorage]`, `[getCurrentSession]`, and `[ensureValidToken]` logs to see where the flow failed (e.g. token null after reopen, session API error, etc.).

### 6. Log prefixes added for debugging

- `[SessionRestore]` — context.js session restore (token read, ensureValidToken, getCurrentSession, setAuth, removeToken).
- `[TokenStorage]` — getToken (when null), getTokenSetAt (when null), setTokenWithTimestamp, removeToken.
- `[ensureValidToken]` / `[refreshAccessToken]` — apiClient token refresh.
- `[getCurrentSession]` — authService GET /api/session success or error.

Remove or guard these with `__DEV__` once you’re done debugging.

---

## If iOS build fails with `RCTPackagerConnection` undefined symbol

This can happen when React Native is built from prebuilt XCFrameworks (no DevSupport). The project is now configured to build React Native from source so `expo-dev-launcher` can link to `RCTPackagerConnection`.

After changing this, clean and reinstall iOS pods:

```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
```

Then run again:

```bash
npx expo run:ios
```

The first build from source will be slower (several minutes); later builds are incremental.
