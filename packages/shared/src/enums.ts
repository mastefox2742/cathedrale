/**
 * Enums metier partages, derives du cahier des charges (workflow editorial section 10,
 * annonces 5.2, formations 5.4).
 */

/** Statut de cycle de vie commun a tout contenu editorial (annonce, homelie, formation...). */
export enum ContentStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  PENDING_VALIDATION = "pending_validation",
  PUBLISHED = "published",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
  REJECTED = "rejected",
}

export enum AnnouncementPriority {
  NORMAL = "normal",
  IMPORTANT = "important",
  URGENT = "urgent",
}

export enum Visibility {
  PUBLIC = "public",
  MEMBERS = "members",
  GROUP = "group",
  STAFF_ONLY = "staff_only",
  PRIVATE = "private",
}

export enum NotificationChannel {
  PUSH = "push",
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  IN_APP = "in_app",
}

export enum PrayerRequestVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  ANONYMOUS = "anonymous",
}

export enum PrayerRequestStatus {
  RECEIVED = "received",
  IN_PROGRESS = "in_progress",
  PROCESSED = "processed",
  ARCHIVED = "archived",
}

/** Type de contenu d'une homelie (cahier des charges 5.3). */
export enum HomilyContentType {
  TEXT = "text",
  AUDIO = "audio",
  VIDEO = "video",
}

/** Type de celebration d'un horaire (cahier des charges 5.1). */
export enum CelebrationType {
  MASS = "mass",
  CONFESSION = "confession",
  ADORATION = "adoration",
  OFFICE = "office",
  OTHER = "other",
}

export enum EventType {
  LITURGY = "liturgy",
  FORMATION = "formation",
  YOUTH = "youth",
  CATECHISM = "catechism",
  FAMILY = "family",
  SOCIAL = "social",
  MEETING = "meeting",
  LIVE = "live",
  SOLIDARITY_CAMPAIGN = "solidarity_campaign",
}

/** Contenus qui DOIVENT passer par une validation avant publication (cahier des charges 10.2). */
export const CONTENT_REQUIRING_VALIDATION = [
  "doctrinal_teaching",
  "catechism_course",
  "official_message",
  "homily",
  "sensitive_announcement",
  "minor_related_content",
  "crisis_communication",
  "ai_generated_content",
] as const;

export type ContentRequiringValidation = (typeof CONTENT_REQUIRING_VALIDATION)[number];
