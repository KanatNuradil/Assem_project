import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "LingoVibe - Interactive English Learning Platform",
  description: "Improve your English skills with level testing, custom assignments, smart pronunciation checkers, and the AI Speaking Club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-brand-soft text-brand-dark">
        {children}
      </body>
    </html>
  );
}
