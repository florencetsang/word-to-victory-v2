# Launching the mobile apps (iOS and Android)

This is a step-by-step guide for releasing Word to Victory on the Apple App Store and Google Play, written for a first launch. It assumes no Mac: iOS builds run on [Codemagic](https://codemagic.io)'s cloud Macs.

## How the mobile app works

The iOS and Android apps are the same React app as the website, wrapped with [Capacitor](https://capacitorjs.com). There is one codebase (`src/`):

- A feature built for the web ships to the phones in the next store build. There is no separate mobile code to update.
- `ios/` and `android/` are the native projects. You rarely edit them by hand.
- Code that must behave differently in the app checks `isNative()` from `src/lib/platform.ts`. Examples:
  - Google and Apple sign-in use the phone's own sign-in sheet (`src/features/auth/nativeAuth.ts`).
  - Invite and share links use your public website address instead of the app's internal address.
  - Links that open the app (sign-in links, invites, shares) are handled in `src/lib/native.ts`.

| Command                             | What it does                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run cap:sync`                  | Builds the web app (without the PWA service worker) and copies it into `ios/` and `android/`              |
| `npm run cap:android`               | Same, then opens Android Studio (for trying the app in an Android emulator)                               |
| `npm run cap:assets`                | Regenerates app icons and splash screens from `assets/`                                                   |
| `node scripts/configure-mobile.mjs` | Writes your domain, Apple Team ID, Google iOS client ID and Android fingerprints into the native projects |

## What it costs

| Item                    | Cost                                                 |
| ----------------------- | ---------------------------------------------------- |
| Domain name             | About $10/year (Cloudflare Registrar sells at cost)  |
| Apple Developer Program | $99/year (required for TestFlight and the App Store) |
| Google Play Console     | $25 once                                             |
| Codemagic               | Free: 500 build minutes a month on macOS             |
| Supabase, Vercel        | Your existing plans                                  |

## The order of things

Some steps need values from earlier ones, so follow this order:

1. [Get a domain](#1-get-a-domain)
2. [Create the developer accounts](#2-create-the-developer-accounts)
3. [Register the app with Apple](#3-register-the-app-with-apple)
4. [Set up Google sign-in](#4-set-up-google-sign-in)
5. [Set up Sign in with Apple](#5-set-up-sign-in-with-apple)
6. [Configure Supabase for the app](#6-configure-supabase-for-the-app)
7. [Set up Codemagic](#7-set-up-codemagic)
8. [Build for iPhone and test with friends on TestFlight](#8-build-for-iphone-and-test-with-friends-on-testflight)
9. [Build for Android and test with friends on Google Play](#9-build-for-android-and-test-with-friends-on-google-play)
10. [Try the app yourself without a phone](#10-try-the-app-yourself-without-a-phone)
11. [Prepare the store listings](#11-prepare-the-store-listings)
12. [Submit for review and launch](#12-submit-for-review-and-launch)
13. [Release updates](#13-release-updates)

---

## 1. Get a domain

The app needs a public web address for invite links, share links and links that open the app. The website moves to this address too.

1. Pick a name, for example `wordtovictory.app`. Check it's free at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/). Create a Cloudflare account, then go to **Domain Registration → Register Domains** and buy it. Turn on auto-renew.
2. Connect it to the website on Vercel:
   1. In Vercel, open the project, then **Settings → Domains**, and add `wordtovictory.app`.
   2. Vercel shows the DNS records it needs, usually an `A` record for the root and a `CNAME` for `www`.
   3. In Cloudflare, go to **DNS → Records** and add those records. Set **Proxy status** to **DNS only** (grey cloud), so that Vercel can issue the HTTPS certificate.
   4. Wait until Vercel shows the domain as **Valid**.
3. In Supabase, go to **Authentication → URL Configuration**:
   - Set **Site URL** to `https://wordtovictory.app`.
   - Add `https://wordtovictory.app/**` to **Redirect URLs**.
4. Write the domain into the native projects and commit:
   ```bash
   node scripts/configure-mobile.mjs --site https://wordtovictory.app
   ```

## 2. Create the developer accounts

**Apple Developer Program ($99/year)**

1. On your iPhone, make sure your Apple Account has two-factor authentication turned on.
2. Enrol at [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/). The easiest route is the **Apple Developer** app on your iPhone.
3. Choose **Individual** or **Organization**:
   - **Individual:** your own name is shown as the seller on the App Store.
   - **Organization:** shows a company or church name, but needs a free [D-U-N-S number](https://developer.apple.com/enroll/duns-lookup/) and a legal entity.
4. Wait for Apple's approval email.

**Google Play Console ($25 once)**

1. Sign up at [play.google.com/console/signup](https://play.google.com/console/signup). Choose a **personal** or **organization** account, pay, and complete identity verification.
2. **Verify a physical Android device.** Play Console asks you to install the **Google Play Console** app on a real phone running **Android 10 or newer** and sign in with your developer account. Older phones (for example, a Galaxy Note 8 on Android 9) and emulators are rejected. If you don't have a newer phone, borrow one for a few minutes, complete the check, then sign out and remove your account from it. You only need to do this once.
3. **Important for personal accounts:** new personal accounts must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before they can publish to everyone. Recruit your friends for this early. See [step 9](#9-build-for-android-and-test-with-friends-on-google-play).

## 3. Register the app with Apple

1. **Note your Team ID.** On [developer.apple.com/account](https://developer.apple.com/account), open **Membership details** and copy your **Team ID** (10 characters). Then run:
   ```bash
   node scripts/configure-mobile.mjs --apple-team-id ABCDE12345
   ```
   This fills in `public/.well-known/apple-app-site-association`, the file that lets `https://wordtovictory.app/join/...` links open the app. Commit it and let Vercel deploy.
2. **Register the bundle ID.** Go to **Certificates, Identifiers & Profiles → Identifiers → +**:
   1. Choose **App IDs**, then **App**.
   2. Description: `Word to Victory`. Bundle ID: **Explicit**, `com.wordtovictory.app`.
   3. Under **Capabilities**, tick **Associated Domains** and **Sign In with Apple**. Click **Continue**, then **Register**.
3. **Create the App Store Connect record.** In [App Store Connect](https://appstoreconnect.apple.com), go to **Apps → + → New App**:
   1. Platform: **iOS**. Name: **Word to Victory** (it must be unique on the App Store; add a subtitle-style word if it's taken).
   2. Primary language: English. Bundle ID: `com.wordtovictory.app`. SKU: `word-to-victory`.
   3. Open the new app, then **General → App Information**, and copy the numeric **Apple ID** (for example `6740000000`). You'll need it in step 7.
4. **Create an App Store Connect API key** so Codemagic can sign and upload builds:
   1. Go to **Users and Access → Integrations → App Store Connect API → Team Keys → +**.
   2. Name it `Codemagic` and give it the **App Manager** role.
   3. **Download the `.p8` file.** Apple only lets you download it once, so keep it safe, for example in a password manager.
   4. Note the **Issuer ID** and **Key ID** shown on that page.

## 4. Set up Google sign-in

Do this in the [Google Cloud Console](https://console.cloud.google.com), in the same project you use for Google sign-in on the website. Create a project if you don't have one yet.

1. **APIs & Services → OAuth consent screen:** fill in the app name, support email, logo, and links to your privacy policy ([step 11](#11-prepare-the-store-listings)). Publish it ("In production") so anyone can sign in.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID.** Create the following:

   | Type        | Settings                                                                 | Used for                                    |
   | ----------- | ------------------------------------------------------------------------ | ------------------------------------------- |
   | Web         | Redirect URI `https://<project>.supabase.co/auth/v1/callback`            | Website, and Android (the token's audience) |
   | iOS         | Bundle ID `com.wordtovictory.app`                                        | iPhone sign-in sheet                        |
   | Android × 2 | Package `com.wordtovictory.app`, one per SHA-1 fingerprint (from step 9) | Android sign-in sheet                       |

   You may already have the Web client from the website setup. Create the Android clients after step 9, when you have the fingerprints.

3. Write the iOS client ID into the iOS project and commit:
   ```bash
   node scripts/configure-mobile.mjs --google-ios-client-id 1234-abcd.apps.googleusercontent.com
   ```
4. In Supabase, go to **Authentication → Providers → Google**:
   - Enter the Web client ID and secret.
   - In **Client IDs**, list both the Web and iOS client IDs, separated by a comma.
   - Leave **Skip nonce check** off. The app sends a nonce for extra security.

## 5. Set up Sign in with Apple

Apple requires Sign in with Apple in any iOS app that offers Google sign-in.

- **In the iPhone app,** it uses the built-in Apple sheet. No extra setup is needed beyond the capability you ticked in step 3.
- **For the website,** you need a Services ID and key; follow the Supabase guide for [Apple sign-in on the web](https://supabase.com/docs/guides/auth/social-login/auth-apple).
- **In Supabase,** go to **Authentication → Providers → Apple**. In **Client IDs**, list your web Services ID **and** `com.wordtovictory.app`, separated by a comma.
- **Android:** the app hides the Apple button on Android because there is no native Apple sheet there. Android users sign in with Google or email.

## 6. Configure Supabase for the app

1. **Authentication → URL Configuration → Redirect URLs:** add `com.wordtovictory.app://**`. Sign-in links requested from the app return to the app through this address.
2. **Authentication → Emails → SMTP Settings:** set up a real email provider, such as [Resend](https://resend.com) (free tier). Supabase's built-in sender only allows a few emails per hour, which isn't enough for testers.
3. Make sure the **Magic Link** email template is `supabase/templates/magic_link.html`. It includes a 6-digit code. If a sign-in link ever opens in the wrong place, testers can type the code into the app instead.

## 7. Set up Codemagic

1. Sign up at [codemagic.io](https://codemagic.io) with your GitHub account, and add the `word-to-victory-v2` repository. When asked, choose **codemagic.yaml** as the configuration.
2. **Team settings → Integrations → Developer Portal → Connect** (on a personal account: **User settings → Integrations**):
   - Upload the `.p8` key from step 3.4, with its Issuer ID and Key ID.
   - Name the integration **exactly** `Word to Victory`; `codemagic.yaml` refers to it by that name.
3. **Create a certificate private key.** Codemagic uses it to create and reuse your iOS distribution certificate. `ssh-keygen` works on Windows (PowerShell), macOS and Linux:
   ```bash
   ssh-keygen -t rsa -b 2048 -m PEM -f wtv_cert_key -q -N ""
   ```
   Keep `wtv_cert_key` in your password manager, and don't commit it.
4. **Team settings → Global variables and secrets (or the app's Environment variables).** Create these groups and variables:

   | Group             | Variable                             | Value                                                     |
   | ----------------- | ------------------------------------ | --------------------------------------------------------- |
   | `word_to_victory` | `VITE_SUPABASE_URL`                  | `https://<project>.supabase.co`                           |
   |                   | `VITE_SUPABASE_PUBLISHABLE_KEY`      | Supabase publishable key                                  |
   |                   | `VITE_AUTH_PROVIDERS`                | `google,apple`                                            |
   |                   | `VITE_PUBLIC_SITE_URL`               | `https://wordtovictory.app`                               |
   |                   | `VITE_GOOGLE_WEB_CLIENT_ID`          | Web client ID from step 4                                 |
   |                   | `VITE_GOOGLE_IOS_CLIENT_ID`          | iOS client ID from step 4                                 |
   | `ios_signing`     | `CERTIFICATE_PRIVATE_KEY`            | The whole contents of `wtv_cert_key` (mark it **Secret**) |
   |                   | `APP_STORE_APPLE_ID`                 | The numeric Apple ID from step 3.3                        |
   | `google_play`     | `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` | Added in step 9 (mark it **Secret**)                      |

## 8. Build for iPhone and test with friends on TestFlight

**Build**

1. In Codemagic, click **Start new build**, choose the branch and the **iOS to TestFlight** workflow, and start it. The build:
   - installs the dependencies and builds the web app;
   - creates the signing certificate and profile;
   - sets a new build number, builds the `.ipa`, and uploads it to App Store Connect.
2. When it finishes, App Store Connect processes the build. You get an email when it's ready under **TestFlight**. Export compliance is answered automatically, because `Info.plist` declares no non-exempt encryption.

If the build fails, open the failing step's log in Codemagic. See [Troubleshooting](#troubleshooting).

**Choose how to invite friends**

| Option               | Who                                                                                                       | Limit  | Review                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| **Internal testing** | People you add to your App Store Connect team (**Users and Access**, role **Customer Support** or higher) | 100    | None, builds are available at once                           |
| **External testing** | Anyone, by email or a **public link**                                                                     | 10,000 | The first build of each version gets a short Beta App Review |

For a group of friends, **external testing with a public link** is the easiest, because friends don't need App Store Connect accounts.

**Set up external testing**

1. In App Store Connect, open **TestFlight → External Testing → +** and create a group, for example "Friends".
2. Add the build.
3. Fill in **Test Information**:
   - **What to Test:** for example, "Sign in, mark chapters as read, try a reading plan, create a group and invite someone. Tell us anything confusing."
   - **Feedback email.**
   - **Sign-in information:** reviewers can use Sign in with Apple, so write that in the review notes. No demo account is needed.
4. Submit for review. Once it's approved, turn on **Public Link** and send the link to your friends.

**What friends do**

1. Install **TestFlight** from the App Store on their iPhone.
2. Open your invite link (or the invite email) and tap **Accept**, then **Install**.
3. To send feedback, take a screenshot in the app and tap **Share Beta Feedback**, or open TestFlight, choose the app and tap **Send Beta Feedback**. Crashes are reported automatically. You'll see everything under **TestFlight → Feedback**.

Each TestFlight build works for 90 days. New builds appear in TestFlight automatically. You don't need to add internal testers to each build; for external groups, add each new build to the group.

## 9. Build for Android and test with friends on Google Play

1. **Create the app.** In Play Console, click **Create app**. Name: Word to Victory. Choose **App**, **Free**, and accept the declarations.
2. **Create an upload key.** This signs what you upload to Google Play; Google then re-signs the app with its own key.
   - `keytool` comes with Java ([Temurin](https://adoptium.net) on Windows). Run:
     ```bash
     keytool -genkeypair -v -keystore wtv-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Save the `.jks` file and both passwords in your password manager. If you lose them, you'll need to ask Google to reset the upload key.
   - In Codemagic, go to **Team settings → Code signing identities → Android keystores** and upload `wtv-upload.jks`, with reference name **exactly** `word_to_victory_upload`.
3. **Run the first build.**
   1. In Codemagic, run the **Android to Google Play internal testing** workflow.
   2. The publishing step will fail on this first run, because Google requires the first upload to be done by hand. That's expected.
   3. Download the `.aab` file from the build's **Artifacts**.
4. **Upload it by hand.**
   1. In Play Console, go to **Test and release → Testing → Internal testing → Create new release**, and accept **Play App Signing**.
   2. Upload the `.aab`, then save and roll out.
5. **Let Codemagic upload future builds.**
   1. In Google Cloud Console (same project as step 4), go to **IAM & Admin → Service Accounts → Create**. Then **Keys → Add key → JSON**, and download the file.
   2. In Play Console, go to **Users and permissions → Invite new users**. Enter the service account's email, choose this app, and allow **Release apps to testing tracks** and **Manage testing tracks**.
   3. Paste the JSON file's contents into the Codemagic variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (group `google_play`).
6. **Fingerprints for links and Google sign-in.**
   1. In Play Console, open **Test and release → App integrity → App signing**. It shows the SHA-1 and SHA-256 for both the **app signing key** and the **upload key**.
   2. Write both SHA-256 values into the website's verification file, then commit (so invite links open the app):
      ```bash
      node scripts/configure-mobile.mjs \
        --android-sha256 <app signing SHA-256> --android-sha256 <upload SHA-256>
      ```
   3. Create the two Android OAuth clients from step 4, one per **SHA-1**.
7. **Invite friends.**
   1. In **Internal testing → Testers**, create an email list with your friends' Google account emails (up to 100).
   2. Copy the **opt-in link** and send it to them.
   3. Friends open the link on their Android phone, tap **Accept invite**, then **Download it on Google Play**.
   4. Collect feedback with a short Google Form or by email. Play Console also shows crashes under **Android vitals**.
8. **Closed testing, if you have a personal account.** Before you can publish to everyone, you need **12+ testers opted in for 14 days in a row** on a **closed** testing track:
   1. Create a closed track (**Testing → Closed testing**) with your friends' emails.
   2. Promote a build to it.
   3. To have Codemagic upload there directly, change `track: internal` to `track: alpha` in `codemagic.yaml`. The closed testing track is called `alpha` in the API.
   4. After the 14 days, apply for production access in the Play Console dashboard.

## 10. Try the app yourself without a phone

- **Android emulator (Windows, macOS or Linux):**
  1. Install [Android Studio](https://developer.android.com/studio).
  2. Create a `.env.local` with the same `VITE_*` values as Codemagic.
  3. Run `npm run cap:android`.
  4. In Android Studio, open **Device Manager**, create a Pixel device, and press **Run**.
  - Google sign-in in a debug build also needs an Android OAuth client with your debug SHA-1. Get it from `cd android && ./gradlew signingReport`. Email sign-in works without it.
- **iPhone:** the iOS Simulator only runs on a Mac. Without one, install your own TestFlight build on an iPhone (add yourself as an internal tester).
- **Quick layout checks:** run `npm run dev` and use your browser's device toolbar (Chrome DevTools, **Toggle device toolbar**).

## 11. Prepare the store listings

You can prepare these while friends are testing.

**Privacy policy (both stores require one)**

- Host it at a URL, for example `https://wordtovictory.app/privacy.html`; put the file in `public/` and Vercel will serve it.
- Say what you collect: email address, display name, reading progress, group membership.
- Say why you collect it: to provide the app's features. Say that it is not sold and not used for tracking.
- Name who processes it: Supabase (hosting) and Google/Apple (if users sign in with them).
- Explain how to delete an account: **Settings → Delete account**, in the app or on the website.

**Apple App Store** (App Store Connect → your app)

| Item                     | What to enter                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | iPhone 6.9" (1320×2868 or 1290×2796). Because the app also runs on iPad, you also need iPad 13" (2064×2752). Make them in TestFlight on a phone, or in the browser's device toolbar at those sizes. |
| Description, keywords    | For example: Bible reading tracker, reading plan, small group, chapter.                                                                                                                             |
| Category                 | Reference, or Books                                                                                                                                                                                 |
| Support URL, privacy URL | Your website and privacy policy                                                                                                                                                                     |
| App Privacy              | **Data collected:** Contact Info (Email Address, Name), Identifiers (User ID), User Content (Other: reading progress). All **linked to the user**, **not used for tracking**.                       |
| Age rating               | Answer the questionnaire; this app should rate 4+                                                                                                                                                   |
| Price                    | Free                                                                                                                                                                                                |

To avoid iPad screenshots, you can make the app iPhone-only. In `ios/App/App.xcodeproj/project.pbxproj`, change both `TARGETED_DEVICE_FAMILY = "1,2";` lines to `TARGETED_DEVICE_FAMILY = 1;`. The app will still run on iPads, in iPhone mode.

**Google Play** (Play Console → your app → **Grow users → Store presence → Main store listing**, and **Policy → App content**)

| Item                                 | What to enter                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| App icon                             | 512×512. Export `assets/icon-only.png` at that size.                                                     |
| Feature graphic                      | 1024×500 banner                                                                                          |
| Phone screenshots                    | 2–8, for example 1080×1920                                                                               |
| Data safety                          | The same data as Apple's App Privacy list. Data is encrypted in transit, and users can request deletion. |
| Account deletion URL                 | `https://wordtovictory.app/settings`, with a note that users sign in and choose **Delete account**       |
| Content rating, target audience, ads | Complete the questionnaires. The app has no ads.                                                         |

## 12. Submit for review and launch

**Apple**

1. In App Store Connect, open your app and fill in the version page (**1.0 Prepare for Submission**). Choose the TestFlight build you want to release.
2. In **App Review Information**, write a note, for example: "Sign in with Apple works for review. You can also sign in with any email address and the 6-digit code from the email." Add your contact details.
3. Choose **Manually release this version** so you control launch day, then click **Submit for Review**.

Common rejection reasons, and how this app handles them:

| Guideline                                      | How the app handles it                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 4.8 Login services                             | Sign in with Apple is offered alongside Google                                                                                          |
| 5.1.1(v) Account deletion                      | **Settings → Delete account**                                                                                                           |
| 4.2 Minimum functionality (repackaged website) | Native sign-in, app files bundled in the binary, links that open the app. Adding reading-reminder notifications later strengthens this. |
| 2.1 App completeness                           | Make sure the review build points at the production Supabase project and sign-in works                                                  |

If Apple rejects the app, the message explains why. You can reply in **App Review → Messages**, fix the problem, and resubmit.

**Google Play**

1. Complete every item on the **Dashboard → Set up your app** checklist.
2. Once you have production access (see the personal-account rule in step 9), go to **Test and release → Production → Create new release**. Promote the tested build and click **Send for review**.
3. In `codemagic.yaml`, change `submit_as_draft: true` to `false` after the first release, so later builds roll out to testers automatically.

## 13. Release updates

1. Build features as usual in `src/`. Test them on the web (`npm run dev`) and, if needed, in the Android emulator.
2. For a new store version, bump the version that users see:
   - **iOS:** `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` (two lines), for example `1.1`.
   - **Android:** `versionName` in `android/app/build.gradle`.
   - Build numbers are set automatically by Codemagic.
3. Run both Codemagic workflows. Builds go to TestFlight and the Play testing track, so friends can check them first. Then submit the new version for review, as in step 12.
4. If you add a Capacitor plugin (`npm install @capacitor/...`), run `npx cap sync` and commit the changes in `ios/` and `android/`.

The website updates as soon as Vercel deploys. The phone apps only change when you publish a new store build, because the app's files are bundled inside it. To push web-only changes without a store review later, look at live-update services such as [Capgo](https://capgo.app). These are allowed when the change doesn't alter the app's purpose.

## Troubleshooting

| Problem                                                             | Fix                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS build fails at "Set up code signing"                            | Check that the integration name is exactly `Word to Victory`, `CERTIFICATE_PRIVATE_KEY` contains the whole key including the BEGIN/END lines, and the bundle ID is registered with both capabilities (step 3).                                                                                                                                                        |
| Google sign-in on Android says `DEVELOPER_ERROR` or does nothing    | The SHA-1 of the key that signed the installed app isn't on an Android OAuth client. Builds from Google Play are signed with the **app signing** key (step 9.6).                                                                                                                                                                                                      |
| Supabase says "Unacceptable audience in id_token"                   | Add the missing client ID (Google web or iOS, or `com.wordtovictory.app` for Apple) to the provider's **Client IDs** in Supabase.                                                                                                                                                                                                                                     |
| Supabase says "Nonces mismatch"                                     | Make sure the app is up to date. The app sends the hashed nonce to Google/Apple and the raw one to Supabase.                                                                                                                                                                                                                                                          |
| An invite link opens the website instead of the app                 | Check `https://wordtovictory.app/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` load and contain your Team ID or fingerprints. Apple caches the file through its CDN: `https://app-site-association.cdn-apple.com/a/v1/wordtovictory.app`. On iOS, links tapped in Safari's address bar don't open apps; tap them from Messages or Notes. |
| The sign-in link opens the browser and says to use the same browser | Type the 6-digit code from the same email into the app instead.                                                                                                                                                                                                                                                                                                       |
| Invite links in the app point to the wrong place                    | Set `VITE_PUBLIC_SITE_URL` in the `word_to_victory` group and rebuild.                                                                                                                                                                                                                                                                                                |
