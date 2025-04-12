import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the session type to include custom fields
   */
  interface Session {
    user: {
      id: number;
      role: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: string;
  }
}
