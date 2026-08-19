import { z } from "zod";

/**
 * Point d'entree UNIQUE pour lire les variables d'environnement cote client.
 * Rappel de securite : seules les cles prefixees NEXT_PUBLIC_ sont accessibles
 * dans le navigateur - tout le reste (secrets, cles d'API tierces) doit rester
 * cote serveur (Server Components / Route Handlers) et ne jamais transiter ici.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("Cathédrale Sacré-Cœur de Brazzaville"),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsed.success) {
  throw new Error(
    `Variables d'environnement publiques invalides ou manquantes:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const env = parsed.data;
