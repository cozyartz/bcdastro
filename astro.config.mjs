import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import { loadEnv } from 'vite';

// Load all environment variables
const env = loadEnv(import.meta.env.MODE, process.cwd(), '');
const {
  JWT_SECRET = 'default_secret',
  STREAM_ACCOUNT_ID = '5182b4d6e3c6433efe0bd3122',
  STREAM_API_TOKEN = '',
  COINBASE_API_KEY = '',
  STRIPE_SECRET_KEY = '',
  RPC_URL = '',
  SITE_URL = 'http://localhost:4321',
  CDP_API_KEY_ID = '',
  CDP_API_KEY_SECRET = '',
  NETWORK_ID = 'base-sepolia',
} = env;

// Validate and normalize SITE_URL
const getValidHostname = (urlString) => {
  try {
    return urlString ? new URL(urlString).hostname : 'localhost';
  } catch (e) {
    console.warn('Invalid SITE_URL, falling back to localhost:', e.message);
    return 'localhost';
  }
};
const imageDomains = [getValidHostname(SITE_URL)];

export default defineConfig({
  integrations: [
    tailwind(),
    react({
      include: ['**/components/*.tsx'],
      experimentalReactChildren: true,
    }),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/cloudflare',
      config: {
        accountId: STREAM_ACCOUNT_ID,
        token: STREAM_API_TOKEN,
      },
    },
    domains: imageDomains,
    serviceEntryPoint: 'compile', // Pre-render images with sharp during build
  },
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    functionPerRoute: true,
  }),
  vite: {
    ssr: {
      noExternal: ['jsonwebtoken', '@coinbase/agentkit', '@modelcontextprotocol/sdk'],
    },
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
  },
});