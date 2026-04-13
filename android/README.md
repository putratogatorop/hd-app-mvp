# Häagen-Dazs Android (Capacitor)

This folder is the native Android shell. It loads the live web app from Vercel (see `capacitor.config.ts` at the repo root for the URL).

## Prerequisites (one-time)

1. Install **Android Studio** — https://developer.android.com/studio
2. Open Android Studio once to finish the setup wizard (SDK download, emulator, etc.).
3. Set `JAVA_HOME` if needed — Android Studio ships with a JDK at `/Applications/Android Studio.app/Contents/jbr/Contents/Home`.

## Build a debug APK (for your own phone)

From the repo root:

```bash
npm run apk:debug
```

The `.apk` lands at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Transfer to your phone (AirDrop / USB / `adb install`), enable "Install from unknown sources", tap to install.

## Build a release APK (for Google Play)

```bash
npm run apk:release
```

Then sign it using Android Studio → **Build → Generate Signed Bundle / APK**. Keep the keystore safe — you need the same one for every future update.

## Open in Android Studio (nicer workflow)

```bash
npm run cap:open
```

Then click ▶️ to build + run on an emulator or a connected phone.

## After changing the Vercel URL

Edit `capacitor.config.ts` → `server.url` at the repo root, then:

```bash
npm run cap:sync
```

## What this app does

It is a thin native Android shell that loads the Next.js PWA from Vercel inside a webview. All UI and business logic remain in the web codebase — so deploying to Vercel updates the mobile app automatically, no APK rebuild needed.

If you later want true offline support or richer native integrations (push, widgets, haptics), swap the `server.url` config for a `webDir` pointing at a `next export` build, and wire in Capacitor plugins.
