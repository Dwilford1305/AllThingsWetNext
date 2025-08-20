// TypeScript shim for @auth0/nextjs-auth0/client import
// This allows importing useUser from '@auth0/nextjs-auth0/client' without type errors

declare module '@auth0/nextjs-auth0/client' {
  import { useUser as realUseUser } from '@auth0/nextjs-auth0';
  export const useUser: typeof realUseUser;
}
