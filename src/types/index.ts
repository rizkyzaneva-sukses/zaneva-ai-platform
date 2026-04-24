import { UserRole, Platform, ContentType, CreatorRelation, TaskStatus, AnalysisType } from '@prisma/client';

export { UserRole, Platform, ContentType, CreatorRelation, TaskStatus, AnalysisType };

// Core App Types (matching Prisma)
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Content {
  id: string;
  brandId: string;
  platform: Platform;
  contentType: ContentType;
  nativePostId: string;
  permalink: string;
  caption?: string | null;
  durationSec?: number | null;
  publishedAt?: Date | null;
  thumbnailUrl?: string | null;
  hookType?: string | null;
  ctaType?: string | null;
  visualTags: string[];
  audioName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Metric {
  id: string;
  contentId: string;
  metricDate: Date;
  views?: bigint | null;
  likes?: bigint | null;
  shares?: bigint | null;
  comments?: bigint | null;
  saves?: bigint | null;
  reach?: bigint | null;
  follows?: bigint | null;
  engagementRate?: number | null;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  createdAt: Date;
}

export interface Creator {
  id: string;
  brandId: string;
  handle: string;
  name?: string | null;
  category?: string | null;
  notes?: string | null;
  createdAt: Date;
}

// AI Adapter Pattern Interface
export interface AIProvider {
  generateText(prompt: string, context?: any): Promise<string>;
  generateStructured(prompt: string, schema: any, context?: any): Promise<any>;
  getProviderName(): string;
  getModel(): string;
}

// AI Analysis Types
export interface AIAnalysisInput {
  analysisType: AnalysisType;
  contentIds?: string[];
  startDate?: string;
  endDate?: string;
  draftCaption?: string;
  visualDesc?: string;
  products?: string[];
  targetPlatform?: Platform;
  message?: string; // for AI chat
}

export interface AIAnalysisOutput {
  narrative: string;
  reasoning: string;
  actionableTasks: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  score?: number; // 1-100 for predictions
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  brandIds: string[]; // accessible brand IDs for PIC
}

// CSV Upload Types
export interface CSVColumnMapping {
  [key: string]: string; // CSV column name -> DB field name
}

export interface InstagramCSVRow {
  'ID Postingan'?: string;
  'Nama pengguna akun'?: string;
  'Nama akun'?: string;
  'Deskripsi'?: string;
  'Durasi'?: string;
  'Waktu penerbitan'?: string;
  'Permalink'?: string;
  'Jenis postingan'?: string;
  'Tayangan'?: string;
  'Suka'?: string;
  'Dibagikan'?: string;
  'Komentar'?: string;
  'Disimpan'?: string;
  'Jangkauan'?: string;
  'Mengikuti'?: string;
}

// Filter Types
export interface ContentFilter {
  brandId?: string;
  platform?: Platform;
  dateFrom?: string;
  dateTo?: string;
  creatorId?: string;
  productId?: string;
  hookType?: string;
}

// RBAC Types
export type RequiredRoles = UserRole | UserRole[];

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
