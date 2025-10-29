import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GlobalPasswordProvider } from "@/contexts/GlobalPasswordContext";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";
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
          <GlobalPasswordProvider>
            <ToastProvider>
              <ConfirmProvider>
                <Navbar />
                <main className="container mx-auto p-6">
                  {children}
                </main>
              </ConfirmProvider>
            </ToastProvider>
          </GlobalPasswordProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
