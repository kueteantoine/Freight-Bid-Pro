import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://freightbidpro.com'),
  applicationName: "Freight Bid Pro",
  title: {
    default: "Freight Bid Pro - Advanced Logistics",
    template: "%s | Freight Bid Pro",
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
  openGraph: {
    title: "Freight Bid Pro - Advanced Logistics",
    description: "Advanced freight bidding and management platform",
    url: '/',
    siteName: 'Freight Bid Pro',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Freight Bid Pro",
    description: "Advanced freight bidding and management platform",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Freight Bid Pro",
    "url": process.env.NEXT_PUBLIC_APP_URL || 'https://freightbidpro.com',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}