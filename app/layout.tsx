import type { Metadata } from "next";
import { EB_Garamond, Crimson_Pro, Special_Elite, Open_Sans, Caveat } from "next/font/google";
import "@/styles/globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-body-loaded",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-card-loaded",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-ui-loaded",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-handwritten-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Kudos Library",
  description: "A library of moments your team made.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${crimsonPro.variable} ${specialElite.variable} ${openSans.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
