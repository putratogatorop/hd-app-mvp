import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'id.haagendazs.app',
  appName: 'Häagen-Dazs',
  // Points the Android app at the live Vercel deployment.
  // Swap this for your custom domain once configured.
  webDir: 'public',
  server: {
    url: 'https://hd-app-mvp.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#40061E',
  },
}

export default config
