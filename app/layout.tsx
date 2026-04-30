import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const defaultSiteUrl = "https://sudoku.mg.mk";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Sudoku — play classic 9×9 puzzles in your browser",
    template: "%s · Sudoku",
  },
  description:
    "Free online Sudoku with notes, undo, difficulty levels, and saved games. Open Advanced tools to build puzzles and run solvers.",
  keywords: [
    "Sudoku",
    "puzzle",
    "9×9",
    "online Sudoku",
    "brain teaser",
    "number puzzle",
  ],
  authors: [{ name: "Sudoku" }],
  openGraph: {
    title: "Sudoku — classic puzzles online",
    description:
      "Play Sudoku with notes, timer, and autosave. Create puzzles and explore solver tools.",
    type: "website",
    locale: "en",
    url: "/",
    siteName: "Sudoku",
  },
  twitter: {
    card: "summary",
    title: "Sudoku — classic puzzles online",
    description:
      "Play Sudoku with notes, timer, and autosave. Create puzzles and explore solver tools.",
  },
  robots: {
    index: true,
    follow: true,
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
