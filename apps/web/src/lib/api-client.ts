import type { ApiErrorResponse } from "@csc/shared";
import { env } from "./env";

/**
 * Client API centralise.
 *
 * Regles de securite appliquees ici :
 * - L'access token n'est JAMAIS stocke en localStorage/sessionStorage (vulnerable
 *   au XSS) : il vit uniquement en memoire (voir auth-context.tsx), perdu au
 *   rechargement de page - d'ou le silent refresh au demarrage de l'app.
 * - Le refresh token (cookie HttpOnly + Secure + SameSite=Strict) n'est JAMAIS
 *   manipule en JS : `credentials: "include"` suffit a le laisser partir avec
 *   la requete vers /auth/refresh.
 * - Sur un 401, on tente UNE fois un refresh puis on rejoue la requete. En cas
 *   d'echec, l'appelant (auth-context) doit deconnecter l'utilisateur.
 */

type TokenGetter = () => string | null;
type TokenSetter = (token: string | null) => void;

let getAccessToken: TokenGetter = () => null;
let setAccessToken: TokenSetter = () => {};

/** Branche le client API sur le contexte React qui detient le token en memoire. */
export function bindTokenAccessors(getter: TokenGetter, setter: TokenSetter): void {
  getAccessToken = getter;
  setAccessToken = setter;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  setAccessToken(data.accessToken);
  return data.accessToken;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Ne pas tenter de joindre l'access token (ex: /auth/login, /auth/register). */
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;

  const doFetch = async (token: string | null): Promise<Response> =>
    fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch(getAccessToken());

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as Partial<ApiErrorResponse>;
    throw new ApiError(response.status, payload.message ?? "Une erreur est survenue", payload.errorId);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export { refreshAccessToken };
