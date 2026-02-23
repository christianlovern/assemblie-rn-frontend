# Android: Deep links opening in browser & push notifications not working

This guide fixes two common issues on **Android builds** (EAS or local) when using **closed testing / production**:

1. **Deep links** (e.g. `https://assemblie.app/connect?orgId=1`) open in the **browser** instead of the app.
2. **Push notifications** never arrive on the device.

---

## Why does iOS work but not Android?

iOS and Android use **different verification systems** for “open this HTTPS link in the app”:

- **iOS (Universal Links)** uses a file on your domain:  
  `https://assemblie.app/.well-known/apple-app-site-association`  
  You already have `associatedDomains` in `app.json` and that AASA file on your site, so iOS works.

- **Android (App Links)** uses a **different** file on the same domain:  
  `https://assemblie.app/.well-known/assetlinks.json`  
  Same idea (prove the domain owns the app), but a different URL and format. If `assetlinks.json` is missing or wrong, Android will open links in the browser. So you need to add and host **assetlinks.json** for Android; the iOS setup does not cover it.

---

## 1. Deep links opening in browser (App Links)

Your app already has **intent filters** in `app.json` and `AndroidManifest.xml` for `https://assemblie.app/connect` and `https://www.assemblie.app/connect` with `autoVerify: true`. For Android to open these links in the app, the **domain must prove it owns the app** via a Digital Asset Links file: `assetlinks.json`.

### Step 1: Get your app’s SHA-256 certificate fingerprint

Play Console does **not** always show a “Digital Asset Links” section. You get the **SHA-256** of the key that signs your app, then build the JSON yourself.

**Option A – From Google Play Console (if you use Play App Signing)**

1. Open [Google Play Console](https://play.google.com/console/) → your app.
2. Go to **Release** → **Setup** → **App integrity**  
   (or open [Key management](https://play.google.com/console/developers/app/keymanagement) for your app).
3. Under **App signing**, find **App signing key certificate** (the key Google uses to sign the app for users).
4. Copy the **SHA-256 certificate fingerprint** (format like `AB:CD:EF:12:34:...`).  
   Use this value in `sha256_cert_fingerprints` in the next step.

**Option B – From your upload keystore (if you sign the app yourself and don’t use Play App Signing)**

If you sign with your own key (e.g. `@assemblie_assemblie.jks`), get SHA-256 from that keystore:

```bash
keytool -list -v -keystore android/app/@assemblie_assemblie.jks -alias YOUR_KEY_ALIAS
```

Enter the keystore password. In the output, under **Certificate fingerprints**, copy the **SHA256** line (the long colon-separated hex string).

### Step 2: Build `assetlinks.json`

Create this JSON (use your real SHA-256 from Step 1). **Use the exact format below**; the fingerprint must be **SHA-256** in uppercase with colons:

```json
[
	{
		"relation": ["delegate_permission/common.handle_all_urls"],
		"target": {
			"namespace": "android_app",
			"package_name": "com.assemblie.app",
			"sha256_cert_fingerprints": ["PASTE_YOUR_SHA256_HERE"]
		}
	}
]
```

Replace `PASTE_YOUR_SHA256_HERE` with the fingerprint you copied (e.g. `E7:AC:F2:02:79:6A:E3:EE:55:8D:8C:F6:6B:88:D7:56:C0:84:80:7C`). You can add multiple fingerprints in the array if you have more than one signing key (e.g. debug + release).

### Step 3: Host it on your domain (Firebase Hosting)

Your site is on **Firebase Hosting**. Do this in the **repo/folder** you use for the website (not necessarily this app repo).

1. **Create the file in the hosting public folder**

    In your **website** project (the one you deploy with `firebase deploy`), create:
    - **Path:** `public/.well-known/assetlinks.json`  
      (or whatever your Firebase Hosting “public” directory is named in `firebase.json`).

    On Mac, create the directory from the terminal (Finder won’t create folders starting with a dot):

    ```bash
    mkdir -p public/.well-known
    ```

    Put the JSON from Step 2 into `public/.well-known/assetlinks.json`.

2. **Set Content-Type and prevent caching in `firebase.json`**

    So the file is served as JSON and **not cached** (so updates show up right away), add headers in `firebase.json`:

    ```json
    "hosting": {
      "public": "public",
      "headers": [
        {
          "source": "/.well-known/assetlinks.json",
          "headers": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
          ]
        }
      ]
    }
    ```

    Redeploy after changing `assetlinks.json` or headers. To confirm the live file has the new SHA-256: open `https://assemblie.app/.well-known/assetlinks.json` in an **incognito/private** window (or use `curl -I` and `curl` the URL); you should see the new fingerprint in the JSON.

3. **Deploy**

    ```bash
    firebase deploy
    ```

4. **Serve for both domains**
    - `https://assemblie.app/.well-known/assetlinks.json`
    - `https://www.assemblie.app/.well-known/assetlinks.json`

    If both hosts point to the same Firebase Hosting site, one deploy serves both. Otherwise, add the same file to the other site and deploy there too. Open both URLs in a browser and confirm you see the JSON (no redirect, no HTML).

### Step 4: Re-verify on the device (required after changing assetlinks.json)

- **If you still see the old SHA-256** when opening `/.well-known/assetlinks.json` in a browser: the response is cached (browser or Firebase CDN). Use an incognito window, add the `Cache-Control` header in Step 2 above, and redeploy; then check again in incognito.
- **If the file is correct in the browser but links still open in the browser:** Android caches App Link verification. Force it to re-check:
    1. On the device: **Settings** → **Apps** → **Assemblie** → **Open by default** → turn **Open supported links** **Off**, then **On** again (or **Clear defaults** then set again).
    2. Or with USB debugging:
        ```bash
        adb shell pm verify-app-links --re-verify com.assemblie.app
        ```
    3. Wait 20–30 seconds, then tap the link again (from Messages, Gmail, or a fresh incognito browser tab).

After this, links like `https://assemblie.app/connect?orgId=1&orgPin=123` should open in the app instead of the browser.

---

## 2. Push notifications not going through (FCM)

On Android, **Expo Push** delivers via **Firebase Cloud Messaging (FCM)**. If your **standalone / EAS build** doesn’t have FCM configured, the app cannot receive push notifications.

### What to do

1. **Firebase project**
    - In [Firebase Console](https://console.firebase.google.com/), use (or create) a project and add an **Android app** with package name **`com.assemblie.app`**.
    - Download **`google-services.json`** and place it in the **project root** (same folder as `app.json`).
    - Add to `.gitignore` if you prefer not to commit it (see step 3 for EAS).

2. **Add the file and point the app config at it**
    - **`google-services.json` is not in this repo** and **`googleServicesFile` has been removed from `app.json`** so builds do not fail. Until you add the file, Android push will not work in production.
    - In Firebase Console → Project settings → Your apps → add an Android app with package com.assemblie.app (or use existing) → download google-services.json and put it in the project root; then add "googleServicesFile": "./google-services.json" under expo.android in app.json. If the file lives elsewhere, use that path (e.g. `"./config/google-services.json"`).
    - **If you don’t have the file yet:** remove or comment out the `googleServicesFile` line so the build doesn’t fail; add it back once you have `google-services.json` from Firebase.

3. **EAS Build (if you use it)**
    - If `google-services.json` is **not** in git:
        - In [expo.dev](https://expo.dev) → your project → **Credentials** → **Android** → add or select the **Application identifier** `com.assemblie.app`.
        - Use **Secrets** to provide the file: create a secret of type **File**, name it e.g. **`GOOGLE_SERVICES_JSON`**, and upload the contents of `google-services.json`. In `app.json` you can keep `"googleServicesFile": "./google-services.json"` and ensure the build uses the secret (see [EAS docs](https://docs.expo.dev/build-reference/variables/#using-secrets-in-builds)).
    - **FCM V1 key for sending:** So that Expo’s servers can send to Android devices, upload a **Google Service Account Key (FCM V1)** to EAS:
        - Firebase Console → Project settings → **Service accounts** → **Generate new private key**.
        - Run `eas credentials -p android`, choose **production** (or your build profile), then **Google Service Account** → **Manage … FCM V1** → **Upload** the JSON key.
    - Rebuild the Android app with EAS after setting both the `google-services.json` (via file or secret) and the FCM V1 key.

4. **Rebuild and test**
    - Build a new AAB/APK and install it (e.g. from closed testing).
    - In the app, ensure notification permission is granted and the device is registered (your existing flow that calls `registerForPushNotificationsAsync` and sends the token to the backend).
    - Send a test notification (via your backend or Expo push tool). Notifications should now be received on the device.

---

## Summary

| Issue                        | Cause                             | Fix                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep links open in browser   | Domain not verified for App Links | Host `assetlinks.json` at `https://assemblie.app/.well-known/assetlinks.json` and `https://www.assemblie.app/.well-known/assetlinks.json` (see Steps 1–2 above); host on Firebase; enable “Open supported links” for the app. |
| Push not received on Android | App not registered with FCM       | Add `google-services.json` (and `googleServicesFile` in app.json), configure FCM V1 key in EAS, rebuild.                                                                                                                      |

After both are done, **create a new Android build** and upload it to closed testing again.
