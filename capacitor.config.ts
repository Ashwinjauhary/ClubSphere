import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.clubsphere.app',
  appName: 'ClubSphere',
  webDir: 'dist',
  server: {
    url: 'https://club-sphere-sepia.vercel.app',
    cleartext: true
  }
};

export default config;
