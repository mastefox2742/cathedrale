"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@csc/shared";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

/**
 * Page de connexion (cahier des charges "Menu public" / user story membre).
 * Ne PAS mettre cette page dans (app) : elle doit rester accessible sans
 * etre connecte, c'est l'inverse d'un RouteGuard qu'il faut ici (rediriger
 * loin de /connexion si deja authentifie, pas l'y forcer).
 */
export default function ConnexionPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/mon-espace");
  }, [isLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Identifiants invalides");
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data);
      router.replace("/mon-espace");
    } catch (error) {
      // Message volontairement generique (voir AllExceptionsFilter cote API) :
      // ne jamais confirmer/infirmer l'existence d'un compte a un attaquant.
      setFormError(error instanceof ApiError ? error.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || user) return null;

  return (
    <section>
      <h1>Connexion</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {fieldError ? <p role="alert">{fieldError}</p> : null}
        {formError ? <p role="alert">{formError}</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </section>
  );
}
