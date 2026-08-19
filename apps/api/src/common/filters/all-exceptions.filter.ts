import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import type { ApiErrorResponse } from "@csc/shared";

/**
 * Filtre d'exceptions global.
 *
 * Regle de securite (checklist "Sécurité du code" - CRITIQUE) : ne JAMAIS
 * renvoyer de stack trace ou de detail d'erreur interne au client, meme en
 * developpement avance vers un environnement partage. Chaque erreur recoit un
 * `errorId` correle dans les logs serveur, permettant le debug sans fuite
 * d'information (chemins de fichiers, requetes SQL, versions de librairies...).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorId = nanoid(12);
    const isHttpException = exception instanceof HttpException;
    const statusCode: number = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Message generique cote client pour les erreurs non maitrisees (5xx).
    // Pour les 4xx HttpException volontaires, on peut renvoyer le message
    // (deja pense pour etre safe cote appelant) mais jamais le detail brut.
    const clientMessage =
      isHttpException && statusCode < Number(HttpStatus.INTERNAL_SERVER_ERROR)
        ? this.extractMessage(exception)
        : "Une erreur est survenue. Contacte le support avec la reference ci-dessous si le probleme persiste.";

    const body: ApiErrorResponse = {
      statusCode,
      message: clientMessage,
      errorId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    // Log serveur complet (sans PII - voir LoggingInterceptor pour la redaction
    // des champs sensibles sur les requetes/reponses).
    this.logger.error(
      `[${errorId}] ${request.method} ${request.originalUrl ?? request.url} -> ${statusCode}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(statusCode).json(body);
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") return response;
    if (typeof response === "object" && response !== null && "message" in response) {
      const message = (response).message;
      return Array.isArray(message) ? message.join(", ") : String(message);
    }
    return exception.message;
  }
}
