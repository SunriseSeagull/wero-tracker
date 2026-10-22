import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/lib/session-context";
import { auth } from "@/lib/auth";
import { cn } from "cn";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wero Tracker - European Payment Adoption Progress",
  description:
    "Track Wero payment adoption across European banks. See which banks support P2P, online, and in-store payments.",
  appleWebApp: {
    title: "Wero Adoption Tracker",
  },
  alternates: {
    types: {
      "application/atom+xml": [
        { url: "/atom", title: "Wero Tracker - Changes" },
      ],
      "application/rss+xml": [{ url: "/rss", title: "Wero Tracker - Changes" }],
      "application/feed+json": [
        { url: "/json", title: "Wero Tracker - Changes" },
      ],
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Not awaited on purpose: the layout stays statically prerenderable and the
  // session streams in with the same response
  const sessionPromise = headers().then((h) =>
    auth.api.getSession({ headers: h }),
  );

  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "font-sans",
        geist.variable,
        geistMono.variable,
        "antialiased",
      )}
    >
      <body>
        <Toaster />
        <SessionProvider sessionPromise={sessionPromise}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
