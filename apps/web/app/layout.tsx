import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHOTobooth Native",
  description: "Web-first MVP for photobooth capture, admin and passport journey."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
