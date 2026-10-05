import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sincro", template: "%s | Sincro" },
  description: "Gestão comercial, estoque e operações",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full"><Toaster richColors position="top-right" />{children}</body>
    </html>
  );
}
