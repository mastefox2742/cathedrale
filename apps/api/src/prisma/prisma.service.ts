import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Regle de securite (couche 03 - Backend) : toutes les requetes passent par
 * Prisma (parameterized queries generees automatiquement). N'utiliser
 * `$queryRawUnsafe` / concatenation de chaines SQL SOUS AUCUN PRETEXTE.
 * Si une requete brute est indispensable, utiliser `$queryRaw` avec des
 * templates tagges (parametrage automatique) et documenter pourquoi.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, "warn" | "error">
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
        // "query" volontairement omis par defaut: les requetes peuvent contenir
        // des donnees utilisateur. Activer localement au besoin uniquement.
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    this.$on("warn", (e) => this.logger.warn(JSON.stringify(e)));
    this.$on("error", (e) => this.logger.error(JSON.stringify(e)));
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on("beforeExit", () => {
      void app.close();
    });
  }
}
