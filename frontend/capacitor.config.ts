import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ec.runcty.ingweb',
  appName: 'RUNCTY',
  webDir: 'dist/frontend/browser',
  server: {
    // Solo desarrollo: la app se sirve como http://localhost para poder llamar
    // a un backend http (10.0.2.2:8000) sin bloqueo por "contenido mixto".
    androidScheme: 'http',
    // Solo desarrollo: Android bloquea el tráfico http sin cifrar si no se permite.
    cleartext: true,
  },
};

export default config;
