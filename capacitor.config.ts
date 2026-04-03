import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aovivo',
  appName: 'AO VIVO',
  webDir: 'dist',
  server: {
    url: 'https://32f681a5-83f5-4aca-bc0c-52ceee51ac20.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
