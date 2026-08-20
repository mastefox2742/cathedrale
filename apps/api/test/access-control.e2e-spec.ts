import { VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { Server } from "node:net";
import { AppModule } from "../src/app.module";

/**
 * Gabarit de tests d'acces par role, demande par le brief produit
 * (cahier des charges section "Avant de coder" : "produis des tests pour les
 * acces public, membre, parent, catechiste et administrateur").
 *
 * Prerequis pour executer ces tests : `docker compose up -d` (Postgres + Redis)
 * et un fichier `.env.local` valide dans apps/api (voir .env.example).
 * A completer au fur et a mesure de l'implementation de chaque module :
 * ajouter un utilisateur de test par role (fixtures/seed dedie aux tests,
 * jamais de donnees de production) et verifier les codes HTTP attendus.
 */
describe("Controle d'acces par role (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Reproduit le prefixe/versioning de main.ts (bootstrap()) : sans ca, les
    // routes reelles sont /announcements/public et non /api/v1/announcements/public,
    // et toutes les requetes ci-dessous echouent en 404 plutot que de tester
    // le vrai comportement d'acces.
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.setGlobalPrefix("api", { exclude: ["health", "health/ready"] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Visiteur (non authentifie)", () => {
    it("peut consulter les annonces publiques sans token", async () => {
      await request(app.getHttpServer() as Server).get("/api/v1/announcements/public").expect(200);
    });

    it("ne peut PAS creer une annonce (401)", async () => {
      await request(app.getHttpServer() as Server)
        .post("/api/v1/announcements")
        .send({ title: "Test", body: "Test" })
        .expect(401);
    });

    it("peut consulter les horaires publies sans token", async () => {
      await request(app.getHttpServer() as Server).get("/api/v1/mass-schedules/public").expect(200);
    });

    it("ne peut PAS creer un horaire (401)", async () => {
      await request(app.getHttpServer() as Server)
        .post("/api/v1/mass-schedules")
        .send({ title: "Messe dominicale", startTime: "09:00" })
        .expect(401);
    });

    it("peut consulter les homelies publiees sans token", async () => {
      await request(app.getHttpServer() as Server).get("/api/v1/homilies/public").expect(200);
    });

    it("ne peut PAS creer une homelie (401)", async () => {
      await request(app.getHttpServer() as Server)
        .post("/api/v1/homilies")
        .send({ title: "Test", celebrant: "Pere Test", date: "2026-01-01", text: "Test" })
        .expect(401);
    });

    it("peut consulter les formations publiees sans token", async () => {
      await request(app.getHttpServer() as Server).get("/api/v1/formations/public").expect(200);
    });

    it("ne peut PAS creer une formation (401)", async () => {
      await request(app.getHttpServer() as Server)
        .post("/api/v1/formations")
        .send({ title: "Test", description: "Test" })
        .expect(401);
    });

    it("peut consulter les evenements publies sans token", async () => {
      await request(app.getHttpServer() as Server).get("/api/v1/events/public").expect(200);
    });

    it("ne peut PAS creer un evenement (401)", async () => {
      await request(app.getHttpServer() as Server)
        .post("/api/v1/events")
        .send({ title: "Test", description: "Test", date: "2026-01-01" })
        .expect(401);
    });
  });

  describe("Membre authentifie sans role staff", () => {
    // TODO: creer un utilisateur de test avec le role "member" via un helper
    // de seed dedie aux tests, se connecter via /auth/login, recuperer le
    // access token, puis verifier que /announcements (POST) renvoie 403.
    it.todo("ne peut pas publier une annonce (403 - permission insuffisante)");
  });

  describe("Responsable pastoral / administrateur", () => {
    it.todo("peut creer puis publier une annonce (201 puis 200)");
    it.todo("peut consulter les journaux d'audit (/audit-log)");
  });

  describe("Donnees sensibles (intentions de priere, signalements)", () => {
    it.todo("un membre ne peut pas lister les intentions de priere des autres utilisateurs");
    it.todo("seul un safeguarding_officer ou super_admin peut voir un safeguarding_report");
  });
});
