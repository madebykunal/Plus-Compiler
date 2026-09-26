import type { Metadata, Viewport } from "next";
import "../styles/base.css";
import "../styles/shell.css";
import "../styles/activity-bar.css";
import "../styles/buttons.css";
import "../styles/terminal.css";
import "../styles/dialog.css";
import "../styles/welcome.css";

export const metadata: Metadata = {
  title: "Plus Compiler",
  description: "A minimal playground for HTML/CSS/JS, C, and Rust.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2b2d30",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
