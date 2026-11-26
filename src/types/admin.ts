export type NavSection =
  | 'overview'
  | 'posts'
  | 'taxonomy'
  | 'media'
  | 'seo'
  | 'analytics'
  | 'users'
  | 'moderation'
  | 'calendar'
  | 'notifications'
  | 'site_studio';

export type PostStatus = 'published' | 'draft' | 'review' | 'scheduled';

export interface PostSeoMeta {
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  ogTitle: string;
  ogDescription: string;
  schemaType: 'Article' | 'NewsArticle' | 'TechArticle' | 'HowTo';
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  authorId: string;
  status: PostStatus;
  coverImage: string;
  coverAlt: string;
  publishedAt: string; // YYYY-MM-DD
  scheduledFor?: string; // YYYY-MM-DD
  updatedAt: string;
  readTimeMin: number;
  views: number;
  organicViews: number;
  avgReadDurationSec: number;
  bounceRate: number;
  commentsCount: number;
  featured: boolean;
  seo: PostSeoMeta;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  altText: string;
  mimeType: string;
  sizeKb: number;
  dimensions: string;
  uploadedAt: string;
  uploadedBy: string;
  folderId?: string;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302;
  hits: number;
  active: boolean;
  createdAt: string;
}

export interface SiteSeoConfig {
  siteName: string;
  titleTemplate: string;
  separator: '|' | '—' | '-';
  baseUrl: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  googleVerificationCode: string;
  analyticsMeasurementId: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapFrequency: 'hourly' | 'daily' | 'weekly';
  sitemapIncludeCategories: boolean;
  sitemapAutoPing: boolean;
}

export type BrandConceptKey = 'orthopedics' | 'pharma' | 'cardiology' | 'wellness' | 'custom';

export interface SiteBrandConfig {
  conceptKey: BrandConceptKey;
  conceptLabel: string;
  brandName: string;
  tagline: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  heroBannerUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaUrl: string;
  secondaryBannerUrl: string;
  secondaryBannerTitle: string;
  primaryColor: string;
  secondaryColor: string;
}

export type BuiltInUserRole = 'admin' | 'editor' | 'writer' | 'seo_specialist' | 'moderator';
export type UserRole = string;

export type PermissionKey =
  | 'posts_publish'
  | 'posts_delete'
  | 'seo_manage'
  | 'analytics_export'
  | 'users_manage'
  | 'moderation_resolve'
  | 'calendar_manage'
  | 'media_manage';

export type RolePermissionMatrix = Record<string, Record<PermissionKey, boolean>>;

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<PermissionKey, boolean>;
  createdAt: string;
}

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  department: string;
  lastActiveAt: string;
  joinedAt: string;
  postsPublished: number;
}

export type DoctorStatus = 'active' | 'on_leave' | 'archived';

export interface DoctorProfile {
  id: string;
  fullName: string;
  title: string;
  specialty: string;
  licenseNo: string;
  department: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  languages: string[];
  availableDays: string;
  featured: boolean;
  status: DoctorStatus;
  updatedAt: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface ModerationComment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  authorIp: string;
  content: string;
  createdAt: string;
  status: ModerationStatus;
  reportReason?: string;
  flaggedWords: string[];
  moderatorReply?: string;
  isBlockedUser?: boolean;
}

export interface SpamFilterConfig {
  blockedWords: string[];
  maxLinksBeforeHold: number;
  autoHoldFirstTimeAuthors: boolean;
  enableRateLimiting: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  linkedPostId?: string;
  tags: string[];
  createdAt: string;
}

export type NotificationCategory = 'moderation' | 'seo' | 'task' | 'publish' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  targetSection: NavSection;
  targetEntityId?: string;
}

export interface NotificationPreferences {
  emailOnModerationQueue: boolean;
  emailOnTaskAssigned: boolean;
  inAppOnSeoAlert: boolean;
  inAppOnScheduledPublish: boolean;
  dailyDigestHour: string;
}

export interface DailyTrafficPoint {
  date: string;
  label: string;
  totalViews: number;
  organicViews: number;
  uniqueVisitors: number;
}

export interface MedicalNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  categoryLabel: string;
  imageUrl: string;
  doctorName: string;
}

export interface PublicAuthorSummary {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  department: string;
}

export interface PublicCommentItem {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: string;
  status: ModerationStatus;
  moderatorReply?: string;
}

export interface PublicHomePayload {
  siteBrand: SiteBrandConfig;
  siteName: string;
  posts: BlogPost[];
  categories: Category[];
  doctors: DoctorProfile[];
  authors: PublicAuthorSummary[];
  comments: PublicCommentItem[];
  news: MedicalNewsItem[];
}

export interface AuthAccountProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: 'admin' | 'member';
  isAdmin: boolean;
  provider: 'password' | 'google';
  canChangePassword: boolean;
}
