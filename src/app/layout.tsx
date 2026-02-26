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
  return children;
}