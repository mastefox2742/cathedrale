import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Champs jamais logges en clair, meme partiellement (checklist "Logs sans PII").
 * On redacte au lieu de simplement filtrer pour garder une trace de la forme
 * de la requete sans exposer la valeur.
 */
const REDACTED_FIELDS = new Set([
  "password",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        REDACTED_FIELDS.has(key.toLowerCase()) ? "[REDACTED]" : redact(val),
      ]),
    );
  }
  return value;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    // IP anonymisee (derniers octets masques) - suffisant pour la correlation
    // d'incidents sans identifier precisement un visiteur.
    const ip = this.anonymizeIp(request.ip ?? "");

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${originalUrl} ${Date.now() - start}ms ip=${ip}`);
        },
        error: () => {
          this.logger.warn(`${method} ${originalUrl} FAILED ${Date.now() - start}ms ip=${ip}`);
        },
      }),
    );
  }

  private anonymizeIp(ip: string): string {
    if (ip.includes(".")) {
      // IPv4: masque le dernier octet
      return ip.replace(/\.\d+$/, ".0");
    }
    if (ip.includes(":")) {
      // IPv6: garde les 3 premiers groupes
      return ip.split(":").slice(0, 3).join(":") + "::";
    }
    return "unknown";
  }
}

export { redact };
