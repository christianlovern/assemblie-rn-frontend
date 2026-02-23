# EAS Android push: "Private key required" and using the secret file

## 1. "Private key required" when uploading to EAS

EAS is asking for the **FCM V1 Service Account Key** — a JSON file that contains a **`private_key`** field. It is **not** the same as **google-services.json**.

| File                         | Where to get it                                                                                          | Contains                                        | Use in EAS                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **google-services.json**     | Firebase Console → Project settings → Your apps → Android app → Download                                 | `project_id`, `client`, etc. **No private key** | Upload as a **File** env var (see below). Used at **build time** so the app can receive FCM.                             |
| **Service Account Key JSON** | Firebase Console → Project settings → **Service accounts** tab → **Generate new private key** → Download | `private_key`, `client_email`, etc.             | Upload in **Credentials** → Android → **Google Service Account** → **FCM V1**. Used by Expo to **send** push to Android. |

If you upload **google-services.json** where EAS asks for the "Google Service Account Key (FCM V1)", you will get **"private key required"**. Use the file from **Service accounts → Generate new private key** for that step.

---

## 2. Ensuring the build uses the secret file (google-services.json)

So that EAS Build has `google-services.json` without committing it:

1. **Create an EAS environment variable of type File**
    - [expo.dev](https://expo.dev) → your project → **Project settings** → **Environment variables** (or **Secrets**).
    - **Add variable** → Type: **File** → Name: **`GOOGLE_SERVICES_JSON`**.
    - Upload your **google-services.json** file.
    - Assign it to the **production** environment (and any other profile you use for Android builds).

2. **This repo is already set up to use it**
    - **`app.config.js`** reads `process.env.GOOGLE_SERVICES_JSON` and passes it to `android.googleServicesFile`. On EAS Build, that env var is set to the path where EAS placed the file.
    - **`eas.json`** has **`"environment": "production"`** on the production build profile, so the build gets the variable.

3. **Local builds**
    - If `GOOGLE_SERVICES_JSON` is not set (e.g. local), `app.config.js` falls back to `./google-services.json`. Keep that file in the project root (and in `.gitignore` if you prefer) for local runs.

After this, **`eas build --platform android --profile production`** will use the secret file for `googleServicesFile`; no need to commit it. The copy from the EAS file path into `android/app/google-services.json` is done by **`android/app/ensure-google-services.gradle`** (applied from `build.gradle`) so that the main `build.gradle` stays parseable by EAS and the build works as before.
