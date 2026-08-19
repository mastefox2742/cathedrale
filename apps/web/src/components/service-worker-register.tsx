"use client";

import { useEffect } from "react";

/** Enregistre le service worker minimal (voir public/sw.js) uniquement en production. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("Echec de l'enregistrement du service worker", error);
    });
  }, []);

  return null;
}
