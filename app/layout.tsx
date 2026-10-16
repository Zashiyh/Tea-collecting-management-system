
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Cooroonduwatte Tea",
  description: "Tea Factory Management System",

  icons: {
    icon: "/favicon-64.png",
    shortcut: "/favicon-64.png",
    apple: "/icons/apple-touch-icon.png",
  },

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Cooroonduwatte Tea",
    statusBarStyle: "default",
  },

  applicationName: "Cooroonduwatte Tea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
