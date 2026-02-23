# Local Build Guide for iOS and Android

Build on your machine instead of EAS Build (cloud). **Local builds are faster and free**—no queue, no Pro plan.

- **iOS**: Xcode (Product > Archive) — same as you do now.
- **Android**: Gradle or Android Studio — the equivalent of Xcode for Android; no Expo cloud involved.

---

## Quick: Test a development build without EAS (no "redirect" error)

If you see **"Unable to determine redirect location for runtime 'custom' and platform 'android'"** when scanning the QR code, you're opening the project in **Expo Go**. This app uses a **development client** (custom runtime), so Expo Go cannot run it.

**Use a local development build instead:**

1. **Build the Android app once on your machine** (requires Android Studio / SDK; ~2–5 min first time):

    ```bash
    npx expo run:android
    ```

    This installs a **development build** on your device or emulator (with push, native modules, etc.).

2. **Start the dev server for that build:**

    ```bash
    npm run start:dev-client
    ```

    (Or `npx expo start --dev-client`.)

3. **On the device:** Open the **Assemblie** app you just installed (the one from step 1), **not** Expo Go. It will show a connection screen—connect to the same Wi‑Fi as your computer and it will find Metro, or enter the URL shown in the terminal. No QR scan with Expo Go needed.

After that, JS/React changes reload in the dev build; you only run `npx expo run:android` again when you change native code or app config.

**Push notifications on local Android build:** The Android app is configured to use Firebase (FCM). Put `google-services.json` (from Firebase Console → Project settings → your Android app) in the **project root**. The build will use it so that "Default FirebaseApp is not initialized" does not occur. See `EAS_ANDROID_PUSH_SETUP.md` and `ANDROID_DEEPLINK_AND_PUSH.md` for FCM and EAS details.

## Prerequisites

### iOS

- macOS with Xcode installed
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

### Android

- **JDK 17** (Android Studio installs this, or install separately)
- **Android Studio** (recommended) — includes SDK and Gradle; set `ANDROID_HOME` (often `~/Library/Android/sdk` on macOS)
- Or **SDK only** + Gradle: ensure `ANDROID_HOME` is set and `$ANDROID_HOME/platform-tools` is on your PATH

## Building for iOS

### 1. Install Dependencies

```bash
cd ios
pod install
cd ..
```

### 2. Build Release for App Store

```bash
# Option 1: Using Expo CLI (recommended)
npx expo run:ios --configuration Release

# Option 2: Using Xcode directly
# Open ios/Assemblie.xcworkspace in Xcode
# Select "Any iOS Device" or a connected device
# Product > Archive
```

### 3. Create Archive for App Store

1. Open `ios/Assemblie.xcworkspace` in Xcode
2. Select "Any iOS Device" as the target
3. Go to **Product > Archive**
4. Once archived, the Organizer window will open
5. Click **Distribute App**
6. Choose **App Store Connect**
7. Follow the prompts to upload

## Building for Android

**Recommended: use Gradle from the command line** (or Android Studio). No EAS, no cloud—same idea as building with Xcode for iOS.

### 1. Build release (no signing setup yet)

Until you add a release keystore (step 2), release builds use the debug keystore—fine for device testing, not for Play Store.

```bash
cd android
./gradlew bundleRelease   # Produces .aab (required for Play Store)
# OR
./gradlew assembleRelease # Produces .apk (for sideloading / testing)
```

**Output:**

- **App Bundle**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`

**Using Android Studio:** Open the `android/` folder in Android Studio, then **Build > Generate Signed Bundle / APK** and follow the wizard (it can create a keystore for you).

### 2. Release signing (for Play Store)

When you’re ready to publish to Google Play:

**Create a keystore (once):**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore and passwords safely; you need them for all future updates.

**Configure signing:** Create `android/keystore.properties` (do not commit this file):

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

`android/app/build.gradle` is already set up to use this file when it exists. If `keystore.properties` is missing, release builds fall back to the debug keystore.

## Important Notes

1. **Build Numbers**: Make sure to increment:
    - iOS: `buildNumber` in `app.json` (currently: 5)
    - Android: `versionCode` in `app.json` (currently: 5)

2. **Excluded Packages**: The following packages are excluded from Android builds due to compatibility issues:
    - `react-native-track-player` (not used in codebase)
    - `react-native-video` (not used in codebase, using WebView instead)

3. **Splash Screen**: The new splash screen colors (`#10192b` background) will be included in the build.

4. **Testing**: Always test release builds on physical devices before submitting to app stores.

## Troubleshooting

### iOS Build Issues

- Clean build folder: In Xcode, **Product > Clean Build Folder** (Shift+Cmd+K)
- Reset pods: `cd ios && rm -rf Pods Podfile.lock && pod install`

### Android Build Issues

- Clean build: `cd android && ./gradlew clean`
- Invalid signing: Make sure `keystore.properties` is correctly configured
- **No space left on device**: The Android release build (native/C++) needs several GB free. Free disk space, then clean and rebuild:
    - Delete Android build caches: `cd android && ./gradlew clean` and remove `android/app/.cxx` and `android/build` and `node_modules/react-native-reanimated/android/build` if present.
    - Clear Gradle caches (reclaim space): `rm -rf ~/.gradle/caches/transforms-* ~/.gradle/caches/build-cache-*` (optional; next build will re-download).
    - Ensure at least **8–10 GB free** before running `npm run android:release` again.
- **Gradle daemon out of memory**: If you see "Daemon will expire after running out of JVM Metaspace", `android/gradle.properties` has increased `MaxMetaspaceSize`; if it still happens, increase it further (e.g. to 1536m).
