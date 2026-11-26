import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Moon,
  Newspaper,
  Search,
  Send,
  Settings,
  Stethoscope,
  Sun,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type {
  AuthAccountProfile,
  BlogPost,
  Category,
  DoctorProfile,
  MedicalNewsItem,
  ModerationComment,
  PublicAuthorSummary,
  PublicCommentItem,
  SiteBrandConfig,
} from '../types/admin';
import { formatNumberTR } from '../utils/seoAudit';
import { CircularLoopRow } from './CircularLoopRow';
import { SafeImage } from './SafeImage';

type PublicSubView = 'landing' | 'blog' | 'doctors' | 'topics' | 'post_detail';

interface PublicBlogHomeProps {
  siteBrand: SiteBrandConfig;
  posts: BlogPost[];
  categories: Category[];
  doctors: DoctorProfile[];
  authors: PublicAuthorSummary[];
  comments: (PublicCommentItem | ModerationComment)[];
  news: MedicalNewsItem[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  account: AuthAccountProfile | null;
  canModerate: boolean;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSubmitComment: (input: {
    postId: string;
    authorName: string;
    content: string;
  }) => Promise<{ ok: boolean; status?: string; error?: string }>;
  onToggleCommentVisibility?: (commentId: string, nextStatus: 'approved' | 'rejected') => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const PublicBlogHome: React.FC<PublicBlogHomeProps> = ({
  siteBrand,
  posts,
  categories,
  doctors,
  authors,
  comments,
  news,
  darkMode,
  onToggleDarkMode,
  account,
  canModerate,
  onOpenLogin,
  onOpenProfile,
  onOpenSettings,
  onOpenAdmin,
  onLogout,
  onSubmitComment,
  onToggleCommentVisibility,
  onDeleteComment,
}) => {
  const [subView, setSubView] = useState<PublicSubView>('landing');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('all');
  const [blogSearch, setBlogSearch] = useState('');
  const [activeNewsModal, setActiveNewsModal] = useState<MedicalNewsItem | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'sitemap' | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Comment form state
  const [commentAuthor, setCommentAuthor] = useState(account?.displayName || '');
  const [commentContent, setCommentContent] = useState('');
  const [commentFeedback, setCommentFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    if (account?.displayName && !commentAuthor) {
      setCommentAuthor(account.displayName);
    }
  }, [account, commentAuthor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalVisits = useMemo(
    () => posts.reduce((sum, p) => sum + p.views, 0),
    [posts]
  );

  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === 'published'),
    [posts]
  );

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.status === 'active'),
    [doctors]
  );

  // Showcase doctors side-by-side in Landing Section 2 (prioritize featured, show all active)
  const showcaseDoctors = useMemo(() => {
    const sorted = [...activeDoctors].sort((a, b) => Number(b.featured) - Number(a.featured));
    return sorted;
  }, [activeDoctors]);

  const activePost = useMemo(
    () => publishedPosts.find((p) => p.id === selectedPostId) ?? null,
    [publishedPosts, selectedPostId]
  );

  const filteredBlogPosts = useMemo(() => {
    const q = blogSearch.trim().toLowerCase();
    return publishedPosts.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
        return false;
      }
      if (selectedDoctorName !== 'all') {
        const authorName = authors.find((a) => a.id === p.authorId)?.name || '';
        const matchesAuthor =
          authorName.toLowerCase().includes(selectedDoctorName.toLowerCase()) ||
          p.content.toLowerCase().includes(selectedDoctorName.toLowerCase());
        if (!matchesAuthor) return false;
      }
      if (q) {
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [publishedPosts, selectedCategoryId, selectedDoctorName, blogSearch, authors]);

  const postComments = useMemo(() => {
    if (!activePost) return [];
    return comments.filter((c) => {
      if (c.postId !== activePost.id) return false;
      if (canModerate) return true;
      return c.status === 'approved';
    });
  }, [comments, activePost, canModerate]);

  const openPostDetail = (postId: string) => {
    setSelectedPostId(postId);
    setSubView('post_detail');
    setCommentFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFilteredBlog = (catId = 'all', doctorName = 'all') => {
    setSelectedCategoryId(catId);
    setSelectedDoctorName(doctorName);
    setSubView('blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost) return;
    setCommentFeedback(null);
    setCommentSubmitting(true);
    try {
      const result = await onSubmitComment({
        postId: activePost.id,
        authorName: commentAuthor.trim(),
        content: commentContent.trim(),
      });
      if (result.ok) {
        setCommentContent('');
        setCommentFeedback({
          type: 'success',
          text:
            result.status === 'pending'
              ? 'Yorumunuz alındı ve editör/doktor onayına gönderildi.'
              : 'Yorumunuz başarıyla yayınlandı.',
        });
      } else {
        setCommentFeedback({
          type: 'error',
          text: result.error || 'Yorum gönderilemedi.',
        });
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  const activeLogo = darkMode
    ? siteBrand.logoDarkUrl || siteBrand.logoLightUrl
    : siteBrand.logoLightUrl;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo & Site Name */}
          <button
            type="button"
            onClick={() => {
              setSubView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex min-w-0 items-center gap-2.5 text-left"
          >
            {activeLogo ? (
              <img
                src={activeLogo}
                alt={siteBrand.brandName}
                className="h-8 max-w-[140px] shrink-0 object-contain"
              />
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: siteBrand.primaryColor }}
              >
                {siteBrand.brandName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {siteBrand.brandName}
              </p>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block dark:text-slate-400">
                {siteBrand.tagline}
              </p>
            </div>
          </button>

          {/* Center: Main Navigation */}
          <nav
            aria-label="Site ana navigasyonu"
            className="hidden items-center gap-1 md:flex"
          >
            {[
              { id: 'landing', label: 'Anasayfa' },
              { id: 'blog', label: 'Blog' },
              { id: 'doctors', label: 'Doktorlar' },
              { id: 'topics', label: 'Konu Başlıkları' },
            ].map((item) => {
              const active =
                subView === item.id ||
                (subView === 'post_detail' && item.id === 'blog');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'blog') {
                      openFilteredBlog('all', 'all');
                    } else {
                      setSubView(item.id as PublicSubView);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Theme + Profile Avatar Dropdown / Login */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            {account ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-label="Profil menüsünü aç"
                  aria-expanded={profileMenuOpen}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1 pr-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <SafeImage
                    src={account.avatarUrl}
                    alt={account.displayName}
                    fallbackLabel={account.displayName}
                    isAvatar
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {account.displayName}
                        </p>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            account.isAdmin
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {account.isAdmin ? 'Yönetici' : 'Üye'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        @{account.username}
                      </p>
                    </div>

                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Profil</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-400" />
                        <span>Ayarlar</span>
                      </button>

                      {account.isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" />
                          <span>Yönetim Paneli</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-1.5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap"
                style={{ backgroundColor: siteBrand.primaryColor }}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Giriş Yap / Kayıt Ol</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-nav */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden dark:border-slate-800">
          {[
            { id: 'landing', label: 'Anasayfa' },
            { id: 'blog', label: 'Blog' },
            { id: 'doctors', label: 'Doktorlar' },
            { id: 'topics', label: 'Konu Başlıkları' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'blog') openFilteredBlog('all', 'all');
                else setSubView(item.id as PublicSubView);
              }}
              className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${
                subView === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* LANDING VIEW */}
      {subView === 'landing' && (
        <main className="mx-auto max-w-[1440px] space-y-12 px-4 py-6 sm:px-6 lg:px-8">
          {/* 1. EN ÜST HERO: OTOMATİK SAĞA DOĞRU KAYAN DOKTOR HABER VİTRİNİ + SİTE HERO BANNERI */}
          <section className="space-y-6">
            {/* Auto-scrolling Rightward Infinite Doctor News Strip */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" style={{ color: siteBrand.primaryColor }} />
                  <span className="font-display text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                    Doktorlardan Güncel Haberler
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Otomatik akış · İncelemek için üzerine gelin veya tıklayın
                </span>
              </div>

              {news.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Şu anda Herhangi bir veri bulunamadı
                </div>
              ) : (
                <CircularLoopRow
                  items={news}
                  getKey={(item) => item.id}
                  autoScroll
                  autoScrollDirection="right"
                  autoScrollSpeedPx={0.6}
                  ariaLabel="Otomatik kayan doktor haberleri vitrini"
                  gapClassName="gap-3.5"
                  renderItem={(item) => (
                    <button
                      type="button"
                      onClick={() => setActiveNewsModal(item)}
                      className="flex w-80 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                    >
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackLabel={item.categoryLabel}
                        className="h-16 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold" style={{ color: siteBrand.primaryColor }}>
                            {item.categoryLabel}
                          </span>
                          <span className="font-mono tabular-nums">{item.publishedAt}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {item.doctorName}
                        </p>
                      </div>
                    </button>
                  )}
                />
              )}
            </div>

            {/* Concept Hero Banner controlled from Site Studio */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-800">
              {siteBrand.heroBannerUrl && (
                <img
                  src={siteBrand.heroBannerUrl}
                  alt={siteBrand.heroTitle}
                  className="absolute inset-0 h-full w-full object-cover opacity-45"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(110deg, ${siteBrand.secondaryColor}F0 18%, ${siteBrand.secondaryColor}99 68%, ${siteBrand.secondaryColor}4D 100%)`,
                }}
              />
              <div className="relative z-10 grid grid-cols-1 items-end gap-6 p-6 sm:p-10 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {siteBrand.conceptLabel}
                  </span>
                  <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
                    {siteBrand.heroTitle}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                    {siteBrand.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSubView('doctors')}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-semibold text-white transition-opacity hover:opacity-95"
                      style={{ backgroundColor: siteBrand.primaryColor }}
                    >
                      <span>{siteBrand.heroCtaLabel || 'Uzman Hekimleri İncele'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openFilteredBlog('all', 'all')}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Tüm Yayınlar ({publishedPosts.length})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-xs">
                  <div>
                    <p className="text-[11px] text-slate-300">Uzman Kadro</p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                      {activeDoctors.length}
                    </p>
                    <p className="text-[11px] text-slate-300">Aktif Hekim</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-300">Yayın Arşivi</p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                      {publishedPosts.length}
                    </p>
                    <p className="text-[11px] text-slate-300">Bilimsel Yazı</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. DOKTOR PROFİL KARTLARI (YAN YANA BÜYÜK KARTLAR) */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                  Uzman Doktor Kadromuz
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Yayın kurulumuzda yer alan uzman hekim profilleri
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubView('doctors')}
                className="text-xs font-semibold hover:underline"
                style={{ color: siteBrand.primaryColor }}
              >
                Tüm Doktorları Gör ({activeDoctors.length}) →
              </button>
            </div>

            {showcaseDoctors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Şu anda Herhangi bir veri bulunamadı
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 gap-5 ${
                  showcaseDoctors.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {showcaseDoctors.map((doc) => (
                  <article
                    key={doc.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <SafeImage
                          src={doc.avatarUrl}
                          alt={doc.fullName}
                          fallbackLabel={doc.fullName}
                          isAvatar
                          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: siteBrand.primaryColor }}
                          >
                            {doc.specialty}
                          </p>
                          <h3 className="mt-0.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                            {doc.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.title}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {doc.bio}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {doc.department}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {doc.availableDays.split('·')[0].trim()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openFilteredBlog('all', doc.fullName.split(' ').slice(-1)[0])}
                        className="font-semibold hover:underline"
                        style={{ color: siteBrand.primaryColor }}
                      >
                        Yazılarını İncele →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 3. KONU BAŞLIKLARI DAİRESEL LOOP BAR (MANUEL SAĞ/SOL DÖNGÜ) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            {categories.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    Konu Başlıkları
                  </h2>
                </div>
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Şu anda Herhangi bir veri bulunamadı
                </div>
              </div>
            ) : (
              <CircularLoopRow
                items={categories}
                getKey={(cat) => cat.id}
                autoScroll={false}
                stepPx={280}
                title="Konu Başlıkları"
                subtitle="Ok butonları veya yatay kaydırma ile dairesel olarak gezinin"
                ariaLabel="Konu başlıkları dairesel döngü şeridi"
                gapClassName="gap-3"
                actionSlot={
                  <button
                    type="button"
                    onClick={() => setSubView('topics')}
                    className="mr-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  >
                    Tümü ({categories.length})
                  </button>
                }
                renderItem={(cat) => {
                  const count = publishedPosts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      type="button"
                      onClick={() => openFilteredBlog(cat.id, 'all')}
                      className="flex w-64 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {count} yazı
                        </span>
                      </div>
                      <p className="mt-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {cat.description}
                      </p>
                    </button>
                  );
                }}
              />
            )}
          </section>

          {/* 4. HABERLER DAİRESEL LOOP SATIRI (MANUEL SAĞ/SOL DÖNGÜ) */}
          <section>
            {news.length === 0 ? (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                  Sağlık ve Klinik Haberler
                </h2>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Şu anda Herhangi bir veri bulunamadı
                </div>
              </div>
            ) : (
              <CircularLoopRow
                items={news}
                getKey={(n) => n.id}
                autoScroll={false}
                stepPx={340}
                title="Sağlık ve Klinik Haberler"
                subtitle="Doktorlarımızı ve tıp dünyasını ilgilendiren güncel gelişmeler"
                ariaLabel="Haberler dairesel döngü satırı"
                gapClassName="gap-4"
                renderItem={(item) => (
                  <button
                    type="button"
                    onClick={() => setActiveNewsModal(item)}
                    className="flex h-full w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackLabel={item.categoryLabel}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold" style={{ color: siteBrand.primaryColor }}>
                            {item.categoryLabel}
                          </span>
                          <span className="font-mono tabular-nums">{item.publishedAt}</span>
                        </div>
                        <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {item.summary}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <span className="truncate font-medium">{item.source}</span>
                        <span className="shrink-0">{item.doctorName}</span>
                      </div>
                    </div>
                  </button>
                )}
              />
            )}
          </section>

          {/* 5. BLOG YAZILARI DAİRESEL LOOP SATIRI (MANUEL SAĞ/SOL DÖNGÜ) */}
          <section>
            {publishedPosts.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    Blog Yazıları
                  </h2>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Şu anda Herhangi bir veri bulunamadı
                </div>
              </div>
            ) : (
              <CircularLoopRow
                items={publishedPosts}
                getKey={(p) => p.id}
                autoScroll={false}
                stepPx={340}
                title="Blog Yazıları"
                subtitle="Uzman doktorlarımızın hazırladığı güncel rehberler ve makaleler"
                ariaLabel="Blog yazıları dairesel döngü satırı"
                gapClassName="gap-4"
                actionSlot={
                  <button
                    type="button"
                    onClick={() => openFilteredBlog('all', 'all')}
                    className="mr-2 text-xs font-semibold hover:underline"
                    style={{ color: siteBrand.primaryColor }}
                  >
                    Tüm Yazılar →
                  </button>
                }
                renderItem={(post) => {
                  const cat = categories.find((c) => c.id === post.categoryId);
                  const author = authors.find((a) => a.id === post.authorId);
                  return (
                    <button
                      type="button"
                      onClick={() => openPostDetail(post.id)}
                      className="flex h-full w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    >
                      <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <SafeImage
                          src={post.coverImage}
                          alt={post.coverAlt}
                          fallbackLabel={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold" style={{ color: cat?.color || siteBrand.primaryColor }}>
                              {cat?.name || 'Genel'}
                            </span>
                            <span className="font-mono tabular-nums">{post.readTimeMin} dk okuma</span>
                          </div>
                          <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                            {post.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {author?.name || 'Editoryal Ekip'}
                          </span>
                          <span className="font-mono tabular-nums">{post.publishedAt}</span>
                        </div>
                      </div>
                    </button>
                  );
                }}
              />
            )}
          </section>

          {/* 6. İKİNCİL TANITIM BANNERI + ANLIK ZİYARET / AKTİF KULLANICILAR */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white lg:col-span-2 dark:border-slate-800">
              {siteBrand.secondaryBannerUrl && (
                <img
                  src={siteBrand.secondaryBannerUrl}
                  alt={siteBrand.secondaryBannerTitle}
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                />
              )}
              <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-300">
                    Bilimsel Yayın Standartları
                  </span>
                  <h2 className="mt-1 font-display text-xl font-bold">
                    {siteBrand.secondaryBannerTitle}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openFilteredBlog('all', 'all')}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: siteBrand.primaryColor }}
                  >
                    Rehberleri İncele
                  </button>
                  {account?.isAdmin && (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      Yönetim Panelinden Özelleştir
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Anlık Aktif</span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <p className="font-mono text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
                    1
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    Aktif oturum
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Toplam Okunma</span>
                  <Eye className="h-4 w-4" style={{ color: siteBrand.primaryColor }} />
                </div>
                <div className="mt-3">
                  <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-white">
                    {formatNumberTR(totalVisits)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Tüm yayınlar
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* BLOG LIST SUBVIEW */}
      {subView === 'blog' && (
        <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Tüm Blog Yazıları
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {filteredBlogPosts.length} yayın listeleniyor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView('landing')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Anasayfaya Dön</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                placeholder="Başlık, özet veya etiket ara..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              aria-label="Konu başlığı filtresi"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Tüm Konu Başlıkları</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selectedDoctorName === 'all' ? '' : selectedDoctorName}
                onChange={(e) => setSelectedDoctorName(e.target.value || 'all')}
                placeholder="Yazar / Doktor adına göre filtrele..."
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {(selectedCategoryId !== 'all' || selectedDoctorName !== 'all' || blogSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSelectedDoctorName('all');
                    setBlogSearch('');
                  }}
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {filteredBlogPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredBlogPosts.map((post) => {
                const cat = categories.find((c) => c.id === post.categoryId);
                const author = authors.find((a) => a.id === post.authorId);
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => openPostDetail(post.id)}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <SafeImage
                        src={post.coverImage}
                        alt={post.coverAlt}
                        fallbackLabel={post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold" style={{ color: cat?.color || siteBrand.primaryColor }}>
                            {cat?.name || 'Genel'}
                          </span>
                          <span className="font-mono tabular-nums">{post.readTimeMin} dk</span>
                        </div>
                        <h2 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
                          {post.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                        <span>{author?.name || 'Editoryal Ekip'}</span>
                        <span className="font-mono tabular-nums">{post.publishedAt}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* DOCTORS DIRECTORY SUBVIEW */}
      {subView === 'doctors' && (
        <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Doktor Kadromuz ve Uzmanlık Alanları
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {activeDoctors.length} aktif uzman hekim
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView('landing')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Anasayfaya Dön</span>
            </button>
          </div>

          {activeDoctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {activeDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-4">
                    <SafeImage
                      src={doc.avatarUrl}
                      alt={doc.fullName}
                      fallbackLabel={doc.fullName}
                      isAvatar
                      className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: siteBrand.primaryColor }}>
                        {doc.specialty}
                      </p>
                      <h2 className="mt-0.5 font-display text-lg font-bold text-slate-900 dark:text-white">
                        {doc.fullName}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.title}</p>
                      <p className="mt-2 font-mono text-[11px] text-slate-400">
                        Sicil: {doc.licenseNo} · {doc.location}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {doc.bio}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                    <span>{doc.availableDays}</span>
                    <span>Diller: {doc.languages.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* TOPICS SUBVIEW */}
      {subView === 'topics' && (
        <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Konu Başlıkları
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                İncelemek istediğiniz uzmanlık alanını seçerek ilgili yazıları filtreleyin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView('landing')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Anasayfaya Dön</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const count = publishedPosts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => openFilteredBlog(cat.id, 'all')}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <FolderTree className="h-4 w-4" />
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {count} yazı
                        </span>
                      </div>
                      <h2 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {cat.description}
                      </p>
                    </div>
                    <span
                      className="mt-4 text-xs font-semibold"
                      style={{ color: siteBrand.primaryColor }}
                    >
                      Yazıları Gör →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* BLOG DETAIL & COMMENTS VIEW */}
      {subView === 'post_detail' && activePost && (
        <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSubView('landing')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Anasayfaya Dön</span>
            </button>
            <button
              type="button"
              onClick={() => openFilteredBlog('all', 'all')}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Tüm Blog Yazıları
            </button>
          </div>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <SafeImage
                src={activePost.coverImage}
                alt={activePost.coverAlt}
                fallbackLabel={activePost.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span
                  className="font-semibold"
                  style={{
                    color:
                      categories.find((c) => c.id === activePost.categoryId)?.color ||
                      siteBrand.primaryColor,
                  }}
                >
                  {categories.find((c) => c.id === activePost.categoryId)?.name || 'Genel'}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Calendar className="h-3.5 w-3.5" />
                  {activePost.publishedAt}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="h-3.5 w-3.5" />
                  {activePost.readTimeMin} dk okuma
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold leading-snug text-slate-900 sm:text-3xl dark:text-white">
                {activePost.title}
              </h1>

              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {activePost.excerpt}
              </p>

              <div className="flex items-center gap-3 border-y border-slate-100 py-4 dark:border-slate-800">
                <SafeImage
                  src={authors.find((a) => a.id === activePost.authorId)?.avatarUrl}
                  alt={authors.find((a) => a.id === activePost.authorId)?.name || 'Yazar'}
                  fallbackLabel={authors.find((a) => a.id === activePost.authorId)?.name || 'ED'}
                  isAvatar
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {authors.find((a) => a.id === activePost.authorId)?.name || 'Editoryal Ekip'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {authors.find((a) => a.id === activePost.authorId)?.department || 'Yayın Kurulu'}
                  </p>
                </div>
              </div>

              <div className="whitespace-pre-line text-sm leading-7 text-slate-800 dark:text-slate-200">
                {activePost.content}
              </div>
            </div>
          </article>

          {/* Comments Section with Doctor/Moderator Hide/Show & Delete */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" style={{ color: siteBrand.primaryColor }} />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Okuyucu Yorumları ({postComments.length})
                </h2>
              </div>
              {canModerate && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Moderatör Kontrolleri Aktif
                </span>
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3 border-b border-slate-100 pb-5 dark:border-slate-800">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Adınız Soyadınız *"
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <textarea
                rows={3}
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Yazı hakkındaki görüşünüzü veya sorunuzu paylaşın..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {commentFeedback && (
                <p
                  className={`text-xs font-medium ${
                    commentFeedback.type === 'success'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {commentFeedback.text}
                </p>
              )}
              <button
                type="submit"
                disabled={commentSubmitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: siteBrand.primaryColor }}
              >
                <Send className="h-3.5 w-3.5" />
                <span>{commentSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}</span>
              </button>
            </form>

            <div className="space-y-3">
              {postComments.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  Şu anda Herhangi bir veri bulunamadı
                </p>
              ) : (
                postComments.map((cm) => {
                  const isHidden = cm.status !== 'approved';
                  return (
                    <div
                      key={cm.id}
                      className={`rounded-xl border p-4 ${
                        isHidden
                          ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20'
                          : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {cm.authorName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                            {cm.createdAt}
                          </span>
                          {isHidden && (
                            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              · Gizli ({cm.status})
                            </span>
                          )}
                        </div>

                        {canModerate && (
                          <div className="flex items-center gap-2">
                            {onToggleCommentVisibility && (
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleCommentVisibility(
                                    cm.id,
                                    cm.status === 'approved' ? 'rejected' : 'approved'
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                {cm.status === 'approved' ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    <span>Gizle</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    <span>Göster</span>
                                  </>
                                )}
                              </button>
                            )}
                            {onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => onDeleteComment(cm.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Sil</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {cm.content}
                      </p>
                      {cm.moderatorReply && (
                        <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50/70 p-2.5 text-xs text-slate-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-slate-300">
                          <span className="font-semibold text-blue-700 dark:text-blue-400">
                            Doktor / Editör Yanıtı:{' '}
                          </span>
                          {cm.moderatorReply}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" style={{ color: siteBrand.primaryColor }} />
              <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                {siteBrand.brandName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {siteBrand.tagline} · © 2026 Tüm Hakları Saklıdır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Gizlilik Politikası
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Kullanım Koşulları
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('sitemap')}
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Site Haritası
            </button>
            {account?.isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="font-semibold hover:underline"
                style={{ color: siteBrand.primaryColor }}
              >
                Yönetim Paneli
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* NEWS DETAIL MODAL */}
      {activeNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
              <SafeImage
                src={activeNewsModal.imageUrl}
                alt={activeNewsModal.title}
                fallbackLabel={activeNewsModal.categoryLabel}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveNewsModal(null)}
                aria-label="Haber penceresini kapat"
                className="absolute top-3 right-3 rounded-lg bg-slate-900/75 p-1.5 text-white hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold" style={{ color: siteBrand.primaryColor }}>
                  {activeNewsModal.categoryLabel}
                </span>
                <span className="font-mono tabular-nums">{activeNewsModal.publishedAt}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {activeNewsModal.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {activeNewsModal.summary}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                <span>Kaynak: {activeNewsModal.source}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {activeNewsModal.doctorName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL / SITEMAP MODAL */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {legalModal === 'privacy'
                  ? 'Gizlilik Politikası'
                  : legalModal === 'terms'
                    ? 'Kullanım Koşulları'
                    : 'Site Haritası'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {legalModal === 'sitemap' ? (
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setLegalModal(null);
                        setSubView('landing');
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Anasayfa
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setLegalModal(null);
                        openFilteredBlog('all', 'all');
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Blog Yazıları ({publishedPosts.length})
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setLegalModal(null);
                        setSubView('doctors');
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Uzman Doktorlar ({activeDoctors.length})
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setLegalModal(null);
                        setSubView('topics');
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Konu Başlıkları ({categories.length})
                    </button>
                  </li>
                </ul>
              ) : legalModal === 'privacy' ? (
                <p>
                  {siteBrand.brandName} yayınlarında paylaşılan tüm içerikler yalnızca bilgilendirme amaçlıdır. Okuyucu yorumları moderasyon politikaları çerçevesinde değerlendirilir ve kişisel veriler üçüncü taraflarla paylaşılmaz.
                </p>
              ) : (
                <p>
                  Bu platformda yer alan makale ve klinik rehberler hekim muayenesi yerine geçmez. Yayın hakları {siteBrand.brandName} editör kuruluna aittir.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
