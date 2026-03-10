import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Robocode Easter Tech Camp 2026 | Ages 6-17 | Robotics, Game Dev, 3D Printing",
  description: "Project-packed holiday tech camps in Solihull, Kingshurst, and Birmingham. Robotics, game development, 3D printing, and more. HAF-funded places available. Book now for Easter 2026.",
  icons: {
    icon: "/mascot.png",
    apple: "/mascot.png",
  },
  openGraph: {
    title: "Robocode Easter Tech Camp 2026",
    description: "Build big in the holidays. Hands-on tech learning for ages 6-17.",
    images: ["/camp/rc-10.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
