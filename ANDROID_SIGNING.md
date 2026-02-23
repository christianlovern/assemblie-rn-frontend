# Android Play Store: "Wrong key" signing error

If Play Console says your App Bundle is signed with the **wrong key**, it means the first version of your app was signed with one certificate, but the build you uploaded was signed with a different one. **You must sign all future uploads with the same key Play expects.**

## Expected vs uploaded

- **Play expects (correct key):**  
  `SHA1: E7:AC:F2:02:79:6A:E3:EE:55:8D:8C:F6:6B:88:D7:56:C0:84:80:7C`
- **Your current build used:**  
  `SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

You need to find the **keystore that has the first SHA1** and use it for every release.

---

## 1. Find the correct keystore

The correct key is in one of these places:

- **Your machine or backup** – e.g. `my-release-key.keystore`, `upload-keystore.jks`, or whatever you used for the first Play upload.
- **EAS (Expo) Build** – If the first production build was done with `eas build --platform android --profile production`, EAS may have created and stored the keystore. Run:
    ```bash
    eas credentials -p android
    ```
    Then choose **Keystore: Manage** and see if there is an existing keystore. You can download it and use it locally.
- **Teammate or previous dev** – Someone may have the original keystore and passwords.

**If you no longer have that keystore**, Google can sometimes reset the key (e.g. if you lost it), but you may need to contact Play support and it can take time. You cannot create a new keystore and use it for the same app; Play will keep rejecting it.

---

## 2. Check a keystore’s SHA1

To confirm a keystore is the one Play expects:

```bash
keytool -list -v -keystore path/to/your.keystore
```

Enter the keystore password. In the output, find **Certificate fingerprint (SHA1)**. It must be:

`E7:AC:F2:02:79:6A:E3:EE:55:8D:8C:F6:6B:88:D7:56:C0:84:80:7C`

If it matches, that’s the keystore to use.

---

## 3. Use that keystore for local builds

1. **Put the keystore** in `android/app/`. For this project use **`@assemblie_assemblie.jks`** in `android/app/`.  
   Do **not** commit it to git (this project already ignores `*.keystore` and `keystore.properties`).

2. **Create `android/keystore.properties`** (do not commit; it’s in `.gitignore`):

    ```properties
    MYAPP_RELEASE_STORE_FILE=@assemblie_assemblie.jks
    MYAPP_RELEASE_KEY_ALIAS=your-key-alias
    MYAPP_RELEASE_STORE_PASSWORD=your-store-password
    MYAPP_RELEASE_KEY_PASSWORD=your-key-password
    ```

    - If the keystore is in `android/app/`, use the filename only (e.g. `upload-keystore.keystore`).
    - If it’s in `android/`, use `../upload-keystore.keystore`.
    - Copy from the example: `cp android/keystore.properties.example android/keystore.properties`, then edit and set the real KEY_ALIAS, STORE_PASSWORD, and KEY_PASSWORD. To find the alias: `keytool -list -keystore android/app/@assemblie_assemblie.jks`.

3. **Build the bundle:**

    ```bash
    cd android
    ./gradlew clean
    ./gradlew bundleRelease
    ```

4. **Output:**  
   `android/app/build/outputs/bundle/release/app-release.aab`  
   Upload this to Play Console. It should now be signed with the expected key.

---

## 4. If you use EAS Build

- If the **correct** key is already in EAS (from the first upload), just run:

    ```bash
    eas build --platform android --profile production
    ```

    and submit that build. Do not override credentials with a new keystore.

- If you have the correct keystore **file** and want EAS to use it:
    1. Run `eas credentials -p android`.
    2. Choose to set/upload the Android keystore and provide the file and passwords.
    3. Run `eas build --platform android --profile production` again.

---

## Summary

- **Cause:** Release builds were signed with the wrong key (e.g. debug keystore or a new key).
- **Fix:** Sign with the keystore whose SHA1 is  
  `E7:AC:F2:02:79:6A:E3:EE:55:8D:8C:F6:6B:88:D7:56:C0:84:80:7C`.
- **Local builds:** Use that keystore in `android/keystore.properties` and `android/app/build.gradle` (release signing is already configured).
- **EAS:** Use the same keystore in EAS credentials and build with the production profile.
