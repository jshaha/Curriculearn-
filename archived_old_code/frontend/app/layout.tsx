import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { PlannerProvider } from '@/components/planner-provider'
import './globals.css'

// NOTE: This previously loaded "Geist" from next/font/google, which requires
// the build machine to reach fonts.googleapis.com. That's a fragile
// dependency once this app moves off Vercel's network onto your own backend
// host (CI runners, Docker builds, offline demo rigs, etc. often can't reach
// it, and the whole `next build` fails). We use the system UI font stack
// instead via CSS variables in globals.css, so there is zero network
// dependency at build time. Swap back to next/font/google if you confirm
// your deployment target always has outbound access to Google Fonts.

export const metadata: Metadata = {
  title: 'Plana — Educator Lesson Planner',
  description:
    'Class homepages and day-by-day summarized lesson plans for educators.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <PlannerProvider>{children}</PlannerProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
