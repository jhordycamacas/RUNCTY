import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (admin/Dockerfile).
  output: 'standalone',
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
