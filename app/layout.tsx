
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Cooroonduwatte Tea",
  description: "Tea Factory Management System",
  applicationName: "Cooroonduwatte Tea",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
      },
      {
        url: "/icons/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cooroonduwatte Tea",
  },
};

export const viewport: Viewport = {
  themeColor: "#020a06",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
