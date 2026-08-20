"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@csc/shared";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

/**
 * Page d'inscription (cahier des charges 2.2 "creer un compte avec email ou
 * telephone" - telephone hors scope pour l'instant, cf CreateUserWithRoles
 * cote e2e qui ne connait que l'email). Meme structure que /connexion :
 * redirige loin de la page si deja authentifie plutot que d'exiger un
 * RouteGuard (c'est l'inverse d'une page protegee).
 */
export default function InscriptionPage() {
  const { user, isLoading, register } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    // Faux positif : ceci compare deux champs de formulaire client-side (UX,
    // pas une verification de secret contre une valeur stockee) - aucune
    // frontiere de securite ni attaquant capable d'observer le timing ici.
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) {
      setFieldError("Les mots de passe ne correspondent pas");
      return;
    }

    const parsed = registerSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Informations invalides");
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data);
      router.replace("/mon-espace");
    } catch (error) {
      // Message volontairement generique (voir AuthService.register cote API) :
      // ne jamais confirmer/infirmer qu'un email est deja utilise.
      setFormError(error instanceof ApiError ? error.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || user) return null;

  return (
    <section>
      <h1>Créer un compte</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="displayName">Nom affiché</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p>12 caractères minimum, avec au moins une minuscule, une majuscule et un chiffre.</p>

        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {fieldError ? <p role="alert">{fieldError}</p> : null}
        {formError ? <p role="alert">{formError}</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
      <p>
        Déjà un compte ? <Link href="/connexion">Se connecter</Link>
      </p>
    </section>
  );
}
