import type { EnvConfig } from "./env.validation";

/** Origines CORS sous forme de tableau, parsees une seule fois. */
export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export type AppEnv = EnvConfig;
