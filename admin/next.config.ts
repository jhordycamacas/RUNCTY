import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // admin/ is its own npm package (no workspaces); the root lockfile belongs to the Firebase tooling.
    root: process.cwd(),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
