# Local Build Guide for iOS and Android

This guide will help you build your app locally instead of using EAS Build, which can be much faster.

## Prerequisites

### iOS
- macOS with Xcode installed
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

### Android
- Java Development Kit (JDK) 17 or higher
- Android Studio with Android SDK
- Set `ANDROID_HOME` environment variable
- Add Android SDK tools to your PATH

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

### 1. Generate Signing Key (First Time Only)
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing
Create `android/keystore.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

Update `android/app/build.gradle` to use the keystore (see Android documentation).

### 3. Build Release APK/AAB
```bash
# Option 1: Using Expo CLI (recommended)
npx expo run:android --variant release

# Option 2: Using Gradle directly
cd android
./gradlew bundleRelease  # For App Bundle (.aab)
# OR
./gradlew assembleRelease  # For APK (.apk)
```

### 4. Output Location
- **App Bundle**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`

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
