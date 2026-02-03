import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  applicationName: "Freight Bid Pro",
  title: {
    default: "Freight Bid Pro",
    template: "%s - Freight Bid Pro",
  },
  description: "Advanced freight bidding and management platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Freight Bid Pro",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}