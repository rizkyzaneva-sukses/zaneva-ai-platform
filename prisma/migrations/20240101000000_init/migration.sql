-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'PIC_BRAND');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('REEL', 'CAROUSEL', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CreatorRelation" AS ENUM ('BRAND_OWNED', 'UGC', 'AFFILIATE', 'PAID_PARTNERSHIP');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('CONTENT_RANKING', 'WEEKLY_REPORT', 'PRE_POST_PREDICTION', 'CAPTION_OPTIMIZE', 'HASHTAG_ANALYSIS', 'AI_CHAT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PIC_BRAND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_brand_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_brand_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "nativePostId" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "durationSec" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "thumbnailUrl" TEXT,
    "hookType" TEXT,
    "ctaType" TEXT,
    "visualTags" TEXT[],
    "audioName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "views" BIGINT DEFAULT 0,
    "likes" BIGINT DEFAULT 0,
    "shares" BIGINT DEFAULT 0,
    "comments" BIGINT DEFAULT 0,
    "saves" BIGINT DEFAULT 0,
    "reach" BIGINT DEFAULT 0,
    "follows" BIGINT DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_products" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "content_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_creators" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "relation" "CreatorRelation" NOT NULL DEFAULT 'UGC',

    CONSTRAINT "content_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_hashtags" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,

    CONSTRAINT "content_hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "contentId" TEXT,
    "title" TEXT NOT NULL,
    "inputPayload" JSONB NOT NULL,
    "outputPayload" JSONB NOT NULL,
    "summaryText" TEXT,
    "providerUsed" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "relatedAnalysisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_configs" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_brand_access_userId_brandId_key" ON "user_brand_access"("userId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "contents_nativePostId_key" ON "contents"("nativePostId");

-- CreateIndex
CREATE UNIQUE INDEX "contents_permalink_key" ON "contents"("permalink");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_contentId_metricDate_key" ON "metrics"("contentId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "content_products_contentId_productId_key" ON "content_products"("contentId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "creators_handle_key" ON "creators"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "content_creators_contentId_creatorId_key" ON "content_creators"("contentId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_tag_key" ON "hashtags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "content_hashtags_contentId_hashtagId_key" ON "content_hashtags"("contentId", "hashtagId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configs_brandId_provider_key" ON "ai_configs"("brandId", "provider");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brand_access" ADD CONSTRAINT "user_brand_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_brand_access" ADD CONSTRAINT "user_brand_access_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_products" ADD CONSTRAINT "content_products_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_products" ADD CONSTRAINT "content_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creators" ADD CONSTRAINT "content_creators_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_creators" ADD CONSTRAINT "content_creators_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtags" ADD CONSTRAINT "hashtags_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_hashtags" ADD CONSTRAINT "content_hashtags_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_hashtags" ADD CONSTRAINT "content_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_relatedAnalysisId_fkey" FOREIGN KEY ("relatedAnalysisId") REFERENCES "ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
