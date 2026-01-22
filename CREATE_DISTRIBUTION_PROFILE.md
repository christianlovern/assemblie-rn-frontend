# Create Distribution Provisioning Profile

Since your bundle identifier is registered, you need to create a **Distribution Provisioning Profile** for App Store submission.

## Step 1: Create Distribution Provisioning Profile

1. Go to [Apple Developer Portal - Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click the **+** button (top left) to create a new profile
3. Select **App Store** under **Distribution** → Click **Continue**
4. Select **App ID**: `com.assemblie.assemblie` → Click **Continue**
5. Select your **Distribution Certificate**:
   - If you don't have one, you'll need to create it first (see Step 2)
   - If you have one, select it → Click **Continue**
6. Enter **Profile Name**: `Assemblie App Store Distribution`
7. Click **Generate**
8. **Download** the profile (`.mobileprovision` file)
9. **Double-click** the downloaded file to install it in Xcode

## Step 2: Create Distribution Certificate (if needed)

If you don't have a distribution certificate:

1. Go to [Apple Developer Portal - Certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click the **+** button
3. Under **Software**, select **Apple Distribution** → Click **Continue**
4. Follow the instructions to create a Certificate Signing Request (CSR):
   - Open **Keychain Access** on your Mac
   - **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Enter your email and name
   - Select **"Saved to disk"** → Click **Continue**
   - Save the `.certSigningRequest` file
5. Upload the CSR file in the Apple Developer portal
6. Download the certificate and **double-click** to install it in Keychain

## Step 3: Configure Xcode

After installing the provisioning profile:

1. **Open Xcode:**
   ```bash
   open ios/Assemblie.xcworkspace
   ```

2. **Select the project:**
   - Click **Assemblie** project → **Assemblie** target
   - Go to **Signing & Capabilities** tab

3. **Configure Signing:**
   - Uncheck **"Automatically manage signing"**
   - Under **Provisioning Profile**, select **"Assemblie App Store Distribution"** (the profile you just created)
   - **Signing Certificate** should auto-select "Apple Distribution"
   - Re-check **"Automatically manage signing"** (Xcode should now recognize the distribution profile)

4. **Try Archiving:**
   - Select **Any iOS Device**
   - **Product** → **Archive**
   - This should now work without the "no devices" error

## Alternative: Let Xcode Auto-Create (Simpler)

If you prefer automatic signing:

1. In Xcode, go to **Signing & Capabilities**
2. Make sure **"Automatically manage signing"** is checked
3. Select your **Team** (Robert Lovern / 42Q62H5FNQ)
4. **Product** → **Clean Build Folder** (Shift+Cmd+K)
5. Close and reopen Xcode
6. Try **Product** → **Archive** again

Xcode should automatically create the distribution profile when you Archive, but sometimes it needs a refresh.

## Why This Happens

- **Development profiles** require registered devices
- **Distribution profiles** (for App Store) don't require devices
- Xcode sometimes tries to create a development profile first before switching to distribution
- Manually creating the distribution profile ensures Xcode uses the correct one
