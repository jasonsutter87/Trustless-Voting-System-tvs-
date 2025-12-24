# Authentication Documentation

This admin portal uses **NextAuth.js v5** with **magic link (passwordless) authentication** via email.

## Overview

Admin users authenticate by:
1. Entering their email address on the login page
2. Receiving a magic link via email
3. Clicking the link to sign in automatically

No passwords are required - authentication is handled through secure, time-limited magic links.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email Provider Configuration
EMAIL_SERVER=
EMAIL_FROM=noreply@veilsuite.com
```

#### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

#### Email Configuration

**For MVP/Development:**
- Leave `EMAIL_SERVER` empty
- Magic links will be logged to the console
- Check your terminal for the login URL

**For Production:**
Use a real email service:

##### Option 1: Resend (Recommended)
```env
EMAIL_SERVER=smtp://resend:re_YOUR_API_KEY@smtp.resend.com:587
EMAIL_FROM=noreply@yourdomain.com
```

##### Option 2: SendGrid
```env
EMAIL_SERVER=smtp://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:587
EMAIL_FROM=noreply@yourdomain.com
```

##### Option 3: Generic SMTP
```env
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Install Dependencies

Dependencies are already installed:
- `next-auth@beta` - NextAuth.js v5
- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript types

### 3. Run the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth API handler
│   ├── auth/
│   │   ├── error/
│   │   │   └── page.tsx              # Auth error page
│   │   └── verify-request/
│   │       └── page.tsx              # "Check your email" page
│   ├── dashboard/
│   │   └── page.tsx                  # Protected dashboard (example)
│   ├── login/
│   │   └── page.tsx                  # Login form
│   ├── layout.tsx                    # Root layout with SessionProvider
│   └── page.tsx                      # Home/landing page
├── components/
│   └── providers/
│       └── session-provider.tsx      # Session provider wrapper
├── lib/
│   └── auth.ts                       # NextAuth configuration
├── middleware.ts                     # Route protection middleware
└── types/
    └── next-auth.d.ts                # TypeScript type extensions
```

## Usage

### Protecting Routes

Routes are protected via middleware. By default, `/dashboard` and all sub-routes require authentication.

To protect additional routes, edit `src/middleware.ts`:

```typescript
const protectedPaths = ["/dashboard", "/elections", "/settings"];
```

### Accessing Session Data

#### Server Components

```typescript
import { auth } from "@/lib/auth";

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    // Not authenticated
    return <div>Please sign in</div>;
  }

  // Access user data
  const email = session.user.email;

  return <div>Welcome {email}</div>;
}
```

#### Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Not signed in</div>;
  }

  return <div>Welcome {session?.user?.email}</div>;
}
```

#### API Routes

```typescript
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle authenticated request
  return Response.json({ data: "Protected data" });
}
```

### Sign Out

#### Server Component (Server Action)

```typescript
import { signOut } from "@/lib/auth";

export default function MyPage() {
  return (
    <form action={async () => {
      "use server";
      await signOut({ redirectTo: "/login" });
    }}>
      <button type="submit">Sign out</button>
    </form>
  );
}
```

#### Client Component

```typescript
"use client";

import { signOut } from "next-auth/react";

export default function MyComponent() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>
      Sign out
    </button>
  );
}
```

## Testing

### Development Mode

1. Start the dev server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in to Admin Portal"
4. Enter any email address (e.g., `admin@example.com`)
5. Check your terminal console for the magic link
6. Copy and paste the URL into your browser
7. You should be redirected to the dashboard

### Production Mode

1. Configure a real email service (see Email Configuration above)
2. Build and start: `pnpm build && pnpm start`
3. Users will receive actual emails with magic links

## Security Considerations

### Magic Links

- Magic links expire after 24 hours
- Each link can only be used once
- Links are cryptographically secure (SHA-256 hashed tokens)

### Session Security

- Sessions are JWT-based (no database required for MVP)
- Session cookies are HTTP-only and secure
- Sessions expire after 30 days of inactivity
- CSRF protection is enabled by default

### Email Verification

- Only verified email addresses can sign in
- Email addresses are case-insensitive and normalized

### Production Checklist

- [ ] Set a strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Configure `NEXTAUTH_URL` to your production domain
- [ ] Use a reliable email service (Resend, SendGrid, etc.)
- [ ] Verify email deliverability
- [ ] Configure DNS (SPF, DKIM, DMARC) for email domain
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up monitoring for failed auth attempts

## Troubleshooting

### Magic links not appearing in console
- Verify `EMAIL_SERVER` is empty or not set
- Check that you're in development mode (`NODE_ENV=development`)
- Look for errors in the terminal

### Emails not sending in production
- Verify `EMAIL_SERVER` connection string is correct
- Check email service API keys/credentials
- Verify sender email is authorized in your email service
- Check spam folder
- Review email service logs

### "Access Denied" error
- User email may not be in allowed list (if implemented)
- Check NextAuth configuration
- Review middleware rules

### Session not persisting
- Verify `NEXTAUTH_SECRET` is set
- Check browser cookies are enabled
- Ensure domain in `NEXTAUTH_URL` matches your site

### CSRF errors
- Ensure `NEXTAUTH_URL` matches your actual domain
- Check that you're not mixing HTTP/HTTPS

## Future Enhancements

### Database Adapter

For production, consider adding a database adapter to:
- Store user accounts
- Track login history
- Manage admin roles and permissions
- Enable account management

Install Prisma adapter:
```bash
pnpm add @auth/prisma-adapter @prisma/client
```

Update `src/lib/auth.ts`:
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  // ... rest of config
};
```

### Role-Based Access Control

Add roles to manage different admin permission levels:

```typescript
// src/lib/auth.ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role; // "admin", "manager", "viewer"
    }
    return token;
  },
  async session({ session, token }) {
    session.user.role = token.role;
    return session;
  },
}
```

### Email Allowlist

Restrict which emails can sign in:

```typescript
// src/lib/auth.ts
callbacks: {
  async signIn({ user }) {
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
    return allowedEmails.includes(user.email);
  },
}
```

### 2FA (Two-Factor Authentication)

Add WebAuthn/TOTP for additional security:
```bash
pnpm add next-auth-webauthn
```

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js GitHub](https://github.com/nextauthjs/next-auth)
- [Email Provider Guide](https://next-auth.js.org/providers/email)
- [Resend Documentation](https://resend.com/docs)
