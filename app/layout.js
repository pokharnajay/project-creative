import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "AI ImageGen - AI-Powered Product Photography Generator",
    template: "%s | AI ImageGen",
  },
  description: "Transform your product photos into professional advertising images with AI. Create stunning visuals with AI models, custom backgrounds, and professional lighting in seconds. No photoshoot required.",
  keywords: [
    "AI image generator",
    "product photography",
    "AI product photos",
    "advertising images",
    "professional product images",
    "AI photography",
    "ecommerce photography",
    "product image generator",
    "AI model photography",
    "automated product photos",
  ],
  authors: [{ name: "AI ImageGen" }],
  creator: "AI ImageGen",
  publisher: "AI ImageGen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ai-imagegen.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI ImageGen - AI-Powered Product Photography Generator",
    description: "Transform your product photos into professional advertising images with AI. Create stunning visuals in seconds.",
    url: "/",
    siteName: "AI ImageGen",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI ImageGen - Professional AI Product Photography",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI ImageGen - AI-Powered Product Photography",
    description: "Create professional product images with AI. No photoshoot required.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
