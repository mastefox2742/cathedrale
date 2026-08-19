import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaHealthIndicator } from "./prisma.health-indicator";

/**
 * Endpoints de sante utilises par les probes d'infrastructure (load balancer,
 * orchestrateur de conteneurs). Publics par nature, mais ne renvoient AUCUNE
 * information interne (pas de version detaillee, pas de stack, pas de config).
 * version: VERSION_NEUTRAL - une probe d'infra ne doit pas dependre d'un
 * numero de version d'API (voir aussi l'exclusion du prefixe /api ci-dessous).
 */
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
  ) {}

  @Public()
  @Get()
  liveness() {
    return { status: "ok" };
  }

  @Public()
  @Get("ready")
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prismaIndicator.isHealthy("database")]);
  }
}
