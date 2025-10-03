import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "crankslist - Your Local Bike Marketplace",
  description: "Buy and sell bikes locally. Find road bikes, mountain bikes, gravel bikes, and more in your area. Simple, trusted, local bike marketplace.",
  openGraph: {
    title: "crankslist - Your Local Bike Marketplace",
    description: "Buy and sell bikes locally. Find road bikes, mountain bikes, gravel bikes, and more in your area.",
    url: "https://crankslist.com",
    siteName: "crankslist",
    images: [
      {
        url: "https://crankslist.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "crankslist - Local Bike Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "crankslist - Your Local Bike Marketplace",
    description: "Buy and sell bikes locally. Find road bikes, mountain bikes, gravel bikes, and more in your area.",
    images: ["https://crankslist.com/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}