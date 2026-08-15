-- MairieConnect — Schema PostgreSQL pour Supabase
-- Exécuter dans Supabase SQL Editor

-- Tenants (Mairies)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "entity_type" TEXT NOT NULL DEFAULT 'mairie',
    "description" TEXT,
    "address" TEXT,
    "post_code" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "department" TEXT,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "source_id" TEXT,
    "imported_at" TIMESTAMPTZ,
    "last_sync_at" TIMESTAMPTZ,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Official Notices (Panneaux)
CREATE TABLE IF NOT EXISTS "official_notices" (
    "id" TEXT PRIMARY KEY,
    "tenant_id" TEXT NOT NULL REFERENCES "tenants"(id) ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_text" TEXT,
    "summary" TEXT,
    "category" TEXT,
    "sign_type" TEXT,
    "is_legal" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "modified_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "source" TEXT NOT NULL DEFAULT 'panneaupocket_import',
    "source_id" TEXT,
    "source_url" TEXT,
    "content_hash" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "source_id")
);
CREATE INDEX IF NOT EXISTS idx_notices_tenant ON "official_notices"("tenant_id", "is_published");
CREATE INDEX IF NOT EXISTS idx_notices_category ON "official_notices"("tenant_id", "category");
CREATE INDEX IF NOT EXISTS idx_notices_hash ON "official_notices"("content_hash");

-- Media
CREATE TABLE IF NOT EXISTS "media" (
    "id" TEXT PRIMARY KEY,
    "notice_id" TEXT NOT NULL REFERENCES "official_notices"(id) ON DELETE CASCADE,
    "type" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "alt_text" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_notice ON "media"("notice_id");

-- Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "email_verified" TIMESTAMPTZ,
    "name" TEXT,
    "password_hash" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'citizen',
    "tenant_id" TEXT REFERENCES "tenants"(id),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON "users"("tenant_id");

-- Auth accounts (NextAuth)
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    UNIQUE("provider", "provider_account_id")
);

-- Auth sessions (NextAuth)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT PRIMARY KEY,
    "session_token" TEXT NOT NULL UNIQUE,
    "user_id" TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
    "expires" TIMESTAMPTZ NOT NULL
);

-- Verification tokens (NextAuth)
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMPTZ NOT NULL,
    UNIQUE("identifier", "token")
);

-- Enable Row Level Security
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "official_notices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;