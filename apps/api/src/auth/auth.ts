import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDatabase, schema } from "@journal/database";
import { env, isProduction } from "../config/env.js";
import { ensureUserRecords } from "./account-bootstrap.js";

const { db } = getDatabase();

/**
 * Better Auth is the only owner of credentials and sessions. Passwords are
 * hashed by Better Auth; no password column exists on `user`.
 * The handler is mounted at /api/auth/* by AuthModule (T2.1).
 */
export const auth = betterAuth({
  appName: "AI Journal",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.trustedOrigins,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },

  user: {
    changeEmail: { enabled: false },
    deleteUser: { enabled: true }
  },

  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/"
    }
  },

  databaseHooks: {
    user: {
      create: {
        // Better Auth's user insert runs first; our rows follow immediately.
        // A failure here must not silently produce a half-initialised account,
        // so we log loudly — GET /me repairs it idempotently.
        after: async (createdUser) => {
          try {
            await ensureUserRecords({
              userId: createdUser.id,
              name: createdUser.name,
              email: createdUser.email
            });
          } catch (error) {
            console.error(
              "[auth] account bootstrap failed; GET /me will repair it:",
              error instanceof Error ? error.message : error
            );
          }
        }
      }
    }
  }
});

export type Auth = typeof auth;
