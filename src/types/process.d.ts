declare namespace NodeJS {
  interface ProcessEnv {
    AUTH0_DOMAIN: string;
    AUTH0_CLIENT_ID: string;
    AUTH0_CLIENT_SECRET: string;
    AUTH0_BASE_URL: string;
    AUTH0_ISSUER_BASE_URL: string;
    AUTH0_REDIRECT_URI?: string;
    AUTH0_POST_LOGOUT_REDIRECT_URI?: string;
    AUTH0_COOKIE_SECRET: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
