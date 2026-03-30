import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonkeyBot Admin",
  description: "Painel administrativo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
