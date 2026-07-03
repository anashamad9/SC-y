import type { Metadata } from "next";
import "../src/index.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercultx.com";
const siteName = "CyberCultX";
const lightLogo = "/light.png";
const darkLogo = "/dark.png";
const siteDescription =
  "CyberCultX is a human-risk intelligence and security readiness platform for psychometric assessment, training recommendations, phishing resilience, and executive cyber culture analytics.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "CyberCultX | Human Risk Intelligence Platform",
    template: "%s | CyberCultX",
  },
  description: siteDescription,
  keywords: [
    "CyberCultX",
    "cyber security awareness",
    "human risk management",
    "security readiness assessment",
    "psychometric cybersecurity assessment",
    "phishing simulation",
    "cyber culture intelligence",
    "security training platform",
  ],
  authors: [{ name: "CyberCultX" }],
  creator: "CyberCultX",
  publisher: "CyberCultX",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: "CyberCultX | Human Risk Intelligence Platform",
    description: siteDescription,
    images: [
      {
        url: lightLogo,
        width: 1367,
        height: 1920,
        alt: "The Harvesters logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberCultX | Human Risk Intelligence Platform",
    description: siteDescription,
    images: [lightLogo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: darkLogo, type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: lightLogo, type: "image/png", media: "(prefers-color-scheme: light)" },
    ],
    shortcut: lightLogo,
    apple: lightLogo,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
