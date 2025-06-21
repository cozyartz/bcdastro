/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly COINBASE_API_KEY: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly JWT_SECRET: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}