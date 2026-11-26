import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type {
  NotificationPreferences,
  PermissionKey,
  PostSeoMeta,
  RolePermissionMatrix,
  SiteBrandConfig,
  SiteSeoConfig,
  SpamFilterConfig,
} from '../types/admin.ts';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('writer'),
  status: text('status').notNull().default('active'),
  department: text('department').notNull().default('Editoryal Ekip'),
  avatarUrl: text('avatar_url'),
  postsPublished: integer('posts_published').notNull().default(0),
  lastActiveAt: text('last_active_at').notNull(),
  joinedAt: text('joined_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  categoryId: text('category_id').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  authorId: text('author_id').notNull(),
  status: text('status').notNull().default('draft'),
  coverImage: text('cover_image').notNull(),
  coverAlt: text('cover_alt').notNull(),
  publishedAt: text('published_at').notNull(),
  scheduledFor: text('scheduled_for'),
  updatedAt: text('updated_at').notNull(),
  readTimeMin: integer('read_time_min').notNull().default(4),
  views: integer('views').notNull().default(0),
  organicViews: integer('organic_views').notNull().default(0),
  avgReadDurationSec: integer('avg_read_duration_sec').notNull().default(0),
  bounceRate: doublePrecision('bounce_rate').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  seo: jsonb('seo').$type<PostSeoMeta>().notNull(),
  ownerUid: text('owner_uid'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mediaAssets = pgTable('media_assets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  altText: text('alt_text').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeKb: integer('size_kb').notNull(),
  dimensions: text('dimensions').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey(),
  siteSeo: jsonb('site_seo').$type<SiteSeoConfig>().notNull(),
  siteBrand: jsonb('site_brand').$type<SiteBrandConfig>(),
  rolePermissions: jsonb('role_permissions').$type<RolePermissionMatrix>().notNull(),
  spamConfig: jsonb('spam_config').$type<SpamFilterConfig>().notNull(),
  notificationPrefs: jsonb('notification_prefs').$type<NotificationPreferences>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const redirects = pgTable('redirects', {
  id: text('id').primaryKey(),
  sourcePath: text('source_path').notNull(),
  targetPath: text('target_path').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  hits: integer('hits').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  authorIp: text('author_ip').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').notNull().default('pending'),
  reportReason: text('report_reason'),
  flaggedWords: jsonb('flagged_words').$type<string[]>().notNull().default([]),
  moderatorReply: text('moderator_reply'),
  isBlockedUser: boolean('is_blocked_user').notNull().default(false),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  assigneeId: text('assignee_id').notNull(),
  dueDate: text('due_date').notNull(),
  linkedPostId: text('linked_post_id'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdAt: text('created_at').notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull(),
  read: boolean('read').notNull().default(false),
  targetSection: text('target_section').notNull(),
  targetEntityId: text('target_entity_id'),
});

export const customRoles = pgTable('custom_roles', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  permissions: jsonb('permissions').$type<Record<PermissionKey, boolean>>().notNull(),
  createdAt: text('created_at').notNull(),
});

export const doctors = pgTable('doctors', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  title: text('title').notNull(),
  specialty: text('specialty').notNull(),
  licenseNo: text('license_no').notNull(),
  department: text('department').notNull(),
  bio: text('bio').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  location: text('location').notNull(),
  languages: jsonb('languages').$type<string[]>().notNull().default(['Türkçe']),
  availableDays: text('available_days').notNull(),
  featured: boolean('featured').notNull().default(false),
  status: text('status').notNull().default('active'),
  updatedAt: text('updated_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
