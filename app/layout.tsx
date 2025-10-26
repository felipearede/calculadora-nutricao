import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculadora de Nutrição de Plantas",
  description: "Sistema de gerenciamento de receitas de nutrição",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="container mx-auto p-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
