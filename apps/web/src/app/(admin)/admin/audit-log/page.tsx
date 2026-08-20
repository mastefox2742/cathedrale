"use client";

import { useEffect, useState } from "react";
import type { Paginated } from "@csc/shared";
import { RouteGuard } from "@/components/route-guard";
import { apiFetch } from "@/lib/api-client";

interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Consultation du journal d'audit (cahier des charges 6 et 11), reservee aux
 * administrateurs (permission "audit_log:view" - voir packages/shared/src/roles.ts).
 * Le layout (admin) exige deja d'etre "staff" ; requireAnyRole ici resserre a
 * admin/super_admin, seuls roles autorises cote serveur pour cette lecture.
 */
export default function AuditLogPage() {
  return (
    <RouteGuard requireAnyRole={["admin", "super_admin"]}>
      <AuditLogContent />
    </RouteGuard>
  );
}

function AuditLogContent() {
  const [data, setData] = useState<Paginated<AuditLogEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiFetch<Paginated<AuditLogEntry>>(`/audit-log?page=${page}&pageSize=20`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger le journal d'audit.");
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <section>
      <h1>Journaux d&apos;audit</h1>
      {error ? <p>{error}</p> : null}
      {!error && !data ? <p>Chargement...</p> : null}
      {data && data.items.length === 0 ? <p>Aucune action journalisee pour le moment.</p> : null}
      {data && data.items.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Ressource</th>
                <th>Auteur</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString("fr-FR")}</td>
                  <td>{entry.action}</td>
                  <td>
                    {entry.resource}
                    {entry.resourceId ? ` (${entry.resourceId})` : ""}
                  </td>
                  <td>{entry.actorId ?? "système"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Page {data.page} - {data.total} action{data.total > 1 ? "s" : ""} au total
          </p>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </button>
          <button
            type="button"
            disabled={page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </>
      ) : null}
    </section>
  );
}
