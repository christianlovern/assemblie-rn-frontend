# Push Notifications: Frontend Gaps & Fixes

This document summarizes gaps in the React Native (Expo) push notification implementation that can cause **Android** devices to not receive notifications (token not obtained or not sent to backend), and the fixes applied.

---

## 1. Where the token is obtained and sent

| Location | When | Notes |
|----------|------|--------|
| **MainAppWrapper** | Once when main app mounts (user + org set), after 1s delay | One-shot via `hasRequestedPushPermission` ref. If this fails (e.g. permission denied, projectId missing, FCM not ready), we never retry. |
| **OrganizationSwitcher** | When user selects an organization | Good fallback when user switches org; also runs when selecting org after login. |
| **Drawer** | When user switches org from drawer | Same as above. |
| **SettingsScreen** | On mount + on focus when permission is granted | On **Android the Notifications section is hidden** (toggle commented out), so users never see the toggle. `checkNotificationStatus` still runs when they open Settings; if permission already granted we get token and register. If they never open Settings or permission wasn’t granted yet, we rely only on MainAppWrapper / org switcher. |
| **SignUp / SignAuth** | After sign up / auth | Token sent after account creation. |

**AuthMain (login)** does **not** call push registration; it only sets user and auth. So the first registration happens in **OrganizationSwitcher** (when they pick an org) or **MainAppWrapper** (when they land on main app with org set).

---

## 2. Gaps identified

### 2.1 Android: projectId missing in bare / Android Studio builds

- **Issue:** `getExpoPushTokenAsync()` requires a `projectId` (EAS project ID). We pass it from `Constants.expoConfig?.extra?.eas?.projectId ?? Constants.manifest?.extra?.eas?.projectId`. In builds from **Android Studio** (no EAS build), the embedded manifest/config can differ; `expoConfig` or `manifest` may be empty or not include `extra.eas.projectId`, so we log "Missing EAS projectId" and return `null` → **no token, no registration**.
- **Fix:** Use a **fallback projectId** from app config (e.g. `app.json` / `app.config.js`) or a constant so bare builds always have a value. Implemented in `notificationUtils.js`.

### 2.2 One-shot registration in MainAppWrapper

- **Issue:** We run push registration only **once** per MainAppWrapper mount (`hasRequestedPushPermission.current = true`). If `registerForPushNotificationsAsync()` fails (Android permission not yet granted, FCM not ready, network error), we never retry. On some Android devices FCM or the permission dialog may not be ready in the first second.
- **Fix:**  
  - Retry when app comes to **foreground** (e.g. user returns to app after granting permission in settings) if we still don’t have a token.  
  - Optionally add **Notifications.addPushTokenListener**: when the native (FCM) token changes, get a new Expo token and re-register with the backend.  
Implemented in MainAppWrapper: retry on foreground + push token listener.

### 2.3 Logout: token not unregistered

- **Issue:** On logout we call `clearUserAndToken()` but **never** call `unregisterPushTokenFromBackend(token)`. The backend keeps the device token, so it could still send notifications to a device that is no longer logged in.
- **Fix:** Before clearing auth, get the current Expo push token (if possible) and call `unregisterPushTokenFromBackend(token)`. Implemented in the sign-out path (e.g. Drawer’s `handleSignOut`).

### 2.4 Android: Settings notification toggle hidden

- **Issue:** The notification toggle is hidden on Android (`Platform.OS !== 'android'`) because it was causing errors. So:  
  - Users are not told to manage notifications in system settings.  
  - The only way to register the token on Android when permission is granted later is to open Settings (which runs `checkNotificationStatus`) or to rely on MainAppWrapper (one-shot) or org switcher.  
- **Fix:**  
  - On Android, show a **Notifications** section that does **not** use the toggle: e.g. a row “Manage notification permissions” that opens `Linking.openSettings()`, and text like “Notifications are enabled/disabled in your device settings.”  
  - Keep calling `checkNotificationStatus` on mount/focus; when permission is granted, get token and send to backend.  
  - Wrap all permission/token logic in try/catch so we never crash; if anything throws (e.g. on some OEMs), we just don’t update the UI and don’t register, but the app stays stable.

### 2.5 No re-registration when Expo push token changes

- **Issue:** On Android, the underlying FCM token can change (e.g. reinstall, token refresh). We don’t listen for token changes, so we might keep sending to an old token.  
- **Fix:** Use `Notifications.addPushTokenListener`. The listener receives the **device** (native) push token; when it fires, call `getExpoPushTokenAsync()` again and `sendPushTokenToBackend()` so the backend gets the new Expo token. Implemented in MainAppWrapper.

### 2.6 Session restore and organization

- **Issue:** On cold start we restore session (user) but **do not** restore organization; organization is set when the user selects an org in OrganizationSwitcher. So when MainAppWrapper first mounts, we have user + organization. No change needed; just note that push registration only runs after org is set (MainAppWrapper or org switcher).

### 2.7 Backend: PATCH device-preferences not used

- **Issue:** Backend supports **PATCH /notifications/device-preferences** to enable/disable notifications per organization without unregistering the token. The app currently only uses register/unregister; when the user turns “Allow Notifications” off we unregister.  
- **Optional:** For multi-org, we could use PATCH to disable for one org instead of unregistering the whole device. Left for later; unregister on “off” is still correct.

---

## 3. Reliability checklist (frontend)

- [x] Use **Expo push token** and `deviceType: 'expo'` (already done).
- [x] **projectId** always available (fallback in notificationUtils).
- [x] **Register** after login (via MainAppWrapper / OrganizationSwitcher when org is set).
- [x] **Re-register** when token changes (addPushTokenListener) and when app returns to foreground if we didn’t get a token yet.
- [x] **Unregister** on logout (get token then unregister before clearUserAndToken).
- [x] **Android:** Show “Manage notifications” in Settings and still run permission check + token send when permission is granted; no crash.
- [x] Request permission before relying on push; respect user choice (we already don’t re-prompt if denied).
- [x] Deep link on notification tap using `data.navigation` / `data.screen` / `data.params` (already in notificationHandler).

---

## 4. Files changed

| File | Changes |
|------|--------|
| `src/utils/notificationUtils.js` | Fallback projectId; safer Android handling; optional retry for getExpoPushTokenAsync. |
| `src/components/MainAppWrapper.js` | Retry registration on app foreground if no token yet; add push token listener to re-register when token changes. |
| `src/components/Drawer.js` | On sign out: get push token, unregister from backend, then clearUserAndToken. |
| `src/screens/menu/SettingsScreen.js` | On Android: show “Manage notification permissions” row (open settings), keep checkNotificationStatus; wrap in try/catch to avoid crashes. |

---

## 5. Testing suggestions

1. **Android (physical device):**  
   - Fresh install → open app → log in → select org. Check logs for “token” and “Sending notification payload”. Confirm backend has the token.  
   - Deny permission → later open Settings → “Manage notification permissions” → enable in system settings → return to app. Open Settings again; confirm token is sent (logs + backend).  
   - Log out → confirm backend no longer has that token (or that unregister was called).

2. **Token refresh:**  
   - After implementing addPushTokenListener, change something that triggers a new FCM token (e.g. reinstall, clear app data) and confirm we re-register with the new Expo token.

3. **Bare build:**  
   - Build from Android Studio (no EAS). Confirm projectId is present (e.g. log it in registerForPushNotificationsAsync) and that getExpoPushTokenAsync succeeds and backend receives the token.
