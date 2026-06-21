import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageTransitionOverlay } from "@/components/PageTransitionOverlay";
import { TransitionProvider } from "@/components/TransitionProvider";
import { siteContent } from "@/content/siteContent";

import "./globals.css";

export const metadata: Metadata = {
  title: siteContent.siteConfig.seo.title,
  description: siteContent.siteConfig.seo.description,
  keywords: siteContent.siteConfig.seo.keywords,
  applicationName: siteContent.siteConfig.name
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TransitionProvider>
          <PageTransitionOverlay />
          {children}
        </TransitionProvider>
      </body>
    </html>
  );
}
