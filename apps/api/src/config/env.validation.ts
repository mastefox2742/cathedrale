import { z } from "zod";

/**
 * Validation stricte des variables d'environnement AU DEMARRAGE.
 * L'application refuse de demarrer si une variable requise manque ou est
 * manifestement une valeur par defaut de dev utilisee en production.
 * Regle de securite (couche 06 - Infra) : ne jamais decouvrir une mauvaise
 * config en production via une erreur silencieuse.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  REDIS_URL: z.string().min(1, "REDIS_URL est requis"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET doit faire au moins 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET doit faire au moins 32 caracteres"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  JWT_ISSUER: z.string().default("cathedrale-sacre-coeur"),

  COOKIE_DOMAIN: z.string().min(1),
  REFRESH_COOKIE_NAME: z.string().default("csc_refresh_token"),

  CORS_ORIGINS: z.string().min(1, "CORS_ORIGINS est requis (liste blanche, jamais '*')"),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT_DEFAULT: z.coerce.number().int().positive().default(100),
  THROTTLE_LIMIT_AUTH: z.coerce.number().int().positive().default(5),

  LOG_LEVEL: z.string().default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

const DEV_DEFAULT_MARKER = "change_me";

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuration d'environnement invalide:\n${issues}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production") {
    const suspicious = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET].some((v) =>
      v.includes(DEV_DEFAULT_MARKER),
    );
    if (suspicious) {
      throw new Error(
        "Secrets JWT par defaut (dev) detectes en production. Genere de vrais secrets avec `openssl rand -base64 64` et stocke-les dans un secrets manager.",
      );
    }
    if (env.CORS_ORIGINS.includes("*")) {
      throw new Error("CORS_ORIGINS ne doit jamais contenir '*' en production.");
    }
  }

  return env;
}
