import NextAuth from "next-auth";
import { createTransport } from "nodemailer";
import type { NextAuthConfig } from "next-auth";
import Email from "next-auth/providers/email";

/**
 * Custom email provider configuration for magic link authentication
 * For MVP, emails are logged to console. In production, use a real email service.
 */
function createEmailProvider() {
  return Email({
    // Use dummy server config - we override sendVerificationRequest anyway
    server: { host: "localhost", port: 25, auth: { user: "", pass: "" } },
    from: process.env.EMAIL_FROM || "noreply@veilsuite.com",
    // Magic link expires in 15 minutes (prevents replay attacks)
    maxAge: 15 * 60,
    // Custom sendVerificationRequest for MVP (console logging)
    async sendVerificationRequest({ identifier: email, url, provider }) {
      const { host } = new URL(url);

      // Check if we have a real email server configured
      const emailServer = process.env.EMAIL_SERVER;

      // MVP mode: log to console instead of sending real emails
      if (!emailServer || process.env.NODE_ENV === "development") {
        console.log("\n==========================================================");
        console.log("MAGIC LINK LOGIN REQUEST");
        console.log("==========================================================");
        console.log(`To: ${email}`);
        console.log(`Login URL: ${url}`);
        console.log("==========================================================\n");
        return;
      }

      // Production: Send actual email
      const transport = createTransport(emailServer);
      const result = await transport.sendMail({
        to: email,
        from: provider.from,
        subject: `Sign in to ${host}`,
        text: text({ url, host }),
        html: html({ url, host, email }),
      });

      const failed = result.rejected.concat(result.pending).filter(Boolean);
      if (failed.length) {
        throw new Error(`Email (${failed.join(", ")}) could not be sent`);
      }
    },
  });
}

/**
 * Email HTML body for magic link
 */
function html({ url, host, email }: { url: string; host: string; email: string }) {
  const escapedEmail = email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedHost = host.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                Sign in to VeilSuite Admin
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                Click the button below to sign in as <strong>${escapedEmail}</strong>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Sign in to ${escapedHost}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #6a6a6a;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e6e6e6;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #8a8a8a;">
                This link will expire in 24 hours. If the button above doesn't work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; line-height: 18px; color: #8a8a8a; word-break: break-all;">
                ${url}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Email text body for magic link (fallback for email clients that don't support HTML)
 */
function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n\n${url}\n\n`;
}

/**
 * NextAuth configuration
 *
 * SECURITY NOTES:
 * - NEXTAUTH_SECRET env var is REQUIRED for JWT signing in production
 * - Session maxAge is 24 hours (reduced from 30 days for security)
 * - Use AUTH_TRUST_HOST=true for Vercel deployments
 */
export const authConfig: NextAuthConfig = {
  providers: [createEmailProvider()],

  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    // 24 hours session (reduced from 30 days for security)
    // Shorter session window reduces attack surface for stolen tokens
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
