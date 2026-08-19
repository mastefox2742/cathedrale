import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cathédrale Sacré-Cœur de Brazzaville",
    template: "%s | Cathédrale Sacré-Cœur de Brazzaville",
  },
  description:
    "Maison numerique de la foi : horaires, annonces, formations, catechisme et vie paroissiale.",
  manifest: "/manifest.webmanifest",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#1f2937",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* AuthProvider est un composant client ("use client") : il englobe
            toute l'app pour exposer useAuth() partout, y compris dans les
            pages publiques (ex: afficher "Se connecter" vs "Mon espace"). */}
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
