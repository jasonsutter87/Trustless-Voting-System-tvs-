# Admin Portal - Quick Start Guide

## Authentication System

The admin portal now has a fully functional authentication system using NextAuth.js with magic link (email) authentication.

## Quick Start

### 1. Start the Development Server

```bash
cd apps/admin
pnpm dev
```

The server will start on `http://localhost:3000`

### 2. Test Authentication Flow

1. **Visit the home page**: Navigate to `http://localhost:3000`
   - You'll see the landing page with features
   - Click "Sign in to Admin Portal"

2. **Login page**: You'll be redirected to `/login`
   - Enter any email address (e.g., `admin@example.com`)
   - Click "Send magic link"

3. **Check your console**: Look at your terminal where `pnpm dev` is running
   - You'll see a magic link URL logged to the console
   - It will look like: `http://localhost:3000/api/auth/callback/email?token=...`

4. **Copy the magic link**: Copy the entire URL from the console

5. **Paste into browser**: Paste the URL and press Enter
   - You'll be automatically signed in
   - Redirected to `/dashboard`

6. **Protected dashboard**: You're now viewing the protected admin dashboard
   - Your email is displayed in the header
   - You can sign out using the "Sign out" button

### 3. Test Protected Routes

Try accessing `/dashboard` directly without being logged in:
- You'll be redirected to `/login`
- After signing in, you'll be redirected back to `/dashboard`

## File Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts  # Auth API endpoint
│   │   ├── auth/
│   │   │   ├── error/page.tsx               # Auth error page
│   │   │   └── verify-request/page.tsx      # "Check email" page
│   │   ├── dashboard/page.tsx               # Protected dashboard
│   │   ├── login/page.tsx                   # Login form
│   │   └── page.tsx                         # Landing page
│   ├── components/
│   │   └── providers/session-provider.tsx   # Session wrapper
│   ├── lib/
│   │   └── auth.ts                          # NextAuth config
│   ├── middleware.ts                        # Route protection
│   └── types/
│       └── next-auth.d.ts                   # Type definitions
├── .env.local                               # Environment variables
├── .env.example                             # Example env vars
├── AUTH.md                                  # Full auth documentation
└── QUICKSTART.md                            # This file
```

## Environment Variables

The `.env.local` file is already configured with:

```env
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
EMAIL_SERVER=                               # Empty = console logging
EMAIL_FROM=noreply@veilsuite.com
```

For development, emails are logged to the console. For production, configure a real email service (see `AUTH.md`).

## What's Implemented

- [x] Magic link authentication (email-based, passwordless)
- [x] Login page with email input
- [x] Verify request page ("check your email")
- [x] Error page for auth failures
- [x] Protected routes via middleware
- [x] Session management (JWT-based)
- [x] Sign out functionality
- [x] Responsive UI with Tailwind CSS
- [x] Development mode (console logging)
- [x] TypeScript types
- [x] Server and client auth helpers

## Next Steps

### For Development
1. Start building admin features on protected pages
2. Add more protected routes as needed
3. Customize the dashboard page

### For Production
1. Configure a real email service (Resend, SendGrid, etc.)
2. Update `EMAIL_SERVER` in `.env.local`
3. Test email delivery
4. Deploy to production

## Common Tasks

### Add a New Protected Route

1. Create your page in `src/app/your-route/page.tsx`
2. Add the route to middleware protection:

```typescript
// src/middleware.ts
const protectedPaths = ["/dashboard", "/your-route"];
```

### Access User Session (Server Component)

```typescript
import { auth } from "@/lib/auth";

export default async function MyPage() {
  const session = await auth();
  return <div>Welcome {session?.user?.email}</div>;
}
```

### Access User Session (Client Component)

```typescript
"use client";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session } = useSession();
  return <div>Welcome {session?.user?.email}</div>;
}
```

### Sign Out

```typescript
// Server Component
import { signOut } from "@/lib/auth";

<form action={async () => {
  "use server";
  await signOut({ redirectTo: "/login" });
}}>
  <button type="submit">Sign out</button>
</form>

// Client Component
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/login" })}>
  Sign out
</button>
```

## Troubleshooting

### Magic link not in console
- Check terminal where `pnpm dev` is running
- Verify `EMAIL_SERVER` is empty in `.env.local`
- Look for the "MAGIC LINK LOGIN REQUEST" separator

### Can't access dashboard
- Make sure you're signed in
- Check browser cookies are enabled
- Try signing out and signing in again

### Session not persisting
- Verify `NEXTAUTH_SECRET` is set in `.env.local`
- Check browser isn't in incognito/private mode
- Clear cookies and try again

## Documentation

- **Full documentation**: See `AUTH.md`
- **NextAuth.js docs**: https://next-auth.js.org/

## Support

For questions or issues:
1. Check `AUTH.md` for detailed documentation
2. Review NextAuth.js documentation
3. Check the console for error messages
