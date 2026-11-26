import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Globe,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  BlogPost,
  RedirectRule,
  SiteSeoConfig,
} from '../types/admin';
import {
  downloadTextFile,
  evaluatePostSeo,
  formatNumberTR,
} from '../utils/seoAudit';
import { SeoScoringCard } from './SeoScoringCard';
import { SearchResearchPanel } from './SearchResearchPanel';

interface SeoModuleViewProps {
  posts: BlogPost[];
  selectedPostId: string;
  onSelectPostId: (id: string) => void;
  onUpdatePost: (post: BlogPost) => void;
  siteSeo: SiteSeoConfig;
  onUpdateSiteSeo: (cfg: SiteSeoConfig) => void;
  redirects: RedirectRule[];
  onAddRedirect: (rule: RedirectRule) => void;
  onToggleRedirect: (id: string) => void;
  onDeleteRedirect: (id: string) => void;
  canManageSeo: boolean;
}

type SeoSubTab = 'post_audit' | 'search_research' | 'site_settings' | 'robots_sitemap' | 'redirects';

export const SeoModuleView: React.FC<SeoModuleViewProps> = ({
  posts,
  selectedPostId,
  onSelectPostId,
  onUpdatePost,
  siteSeo,
  onUpdateSiteSeo,
  redirects,
  onAddRedirect,
  onToggleRedirect,
  onDeleteRedirect,
  canManageSeo,
}) => {
  const [subTab, setSubTab] = useState<SeoSubTab>('post_audit');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [savedBanner, setSavedBanner] = useState('');

  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCode, setNewCode] = useState<301 | 302>(301);

  const activePost = posts.find((p) => p.id === selectedPostId) ?? posts[0];
  const audit = useMemo(
    () => (activePost ? evaluatePostSeo(activePost) : null),
    [activePost]
  );

  const showSaved = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 2500);
  };

  const generatedSchemaJson = useMemo(() => {
    if (!activePost) return '';
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': activePost.seo.schemaType || 'Article',
        headline: activePost.seo.seoTitle || activePost.title,
        description: activePost.seo.metaDescription || activePost.excerpt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id':
            activePost.seo.canonicalUrl ||
            `${siteSeo.baseUrl}/blog/${activePost.slug}`,
        },
        datePublished: activePost.publishedAt,
        dateModified: activePost.updatedAt,
        publisher: {
          '@type': 'Organization',
          name: siteSeo.siteName,
        },
      },
      null,
      2
    );
  }, [activePost, siteSeo]);

  const generatedSitemapXml = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published' && !p.seo.noIndex);
    const urls = published
      .map(
        (p) => `  <url>
    <loc>${siteSeo.baseUrl}/blog/${p.slug}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>${siteSeo.sitemapFrequency}</changefreq>
    <priority>${p.featured ? '0.9' : '0.8'}</priority>
  </url>`
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }, [posts, siteSeo]);

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSeo) return;
    if (!newSource.trim() || !newTarget.trim()) return;
    onAddRedirect({
      id: `red-${Date.now()}`,
      sourcePath: newSource.startsWith('/') ? newSource.trim() : `/${newSource.trim()}`,
      targetPath: newTarget.startsWith('/') || newTarget.startsWith('http')
        ? newTarget.trim()
        : `/${newTarget.trim()}`,
      statusCode: newCode,
      hits: 0,
      active: true,
      createdAt: '2026-11-26',
    });
    setNewSource('');
    setNewTarget('');
    showSaved('Yönlendirme kuralı eklendi.');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {[
            { id: 'post_audit', label: 'Yazı SEO ve SERP Önizleme' },
            { id: 'search_research', label: 'Google Arama Araştırması' },
            { id: 'site_settings', label: 'Genel Site SEO ve Sosyal' },
            { id: 'robots_sitemap', label: 'Robots.txt ve Sitemap' },
            { id: 'redirects', label: `URL Yönlendirmeleri (${redirects.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as SeoSubTab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!canManageSeo && (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Salt okunur mod (SEO yönetim yetkisi gerektirir)
            </span>
          )}
          {savedBanner && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {savedBanner}
            </span>
          )}
        </div>
      </div>

      {/* 1. Post-Level SEO & SERP Preview */}
      {subTab === 'post_audit' && activePost && audit && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 xl:col-span-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Denetlenecek Blog Yazısı
                </label>
                <select
                  value={activePost.id}
                  onChange={(e) => onSelectPostId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">SEO Uyum Skoru</span>
                <p
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    audit.score >= 80
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : audit.score >= 55
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  %{audit.score}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Odak Anahtar Kelime
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={activePost.seo.focusKeyword}
                  onChange={(e) =>
                    onUpdatePost({
                      ...activePost,
                      seo: { ...activePost.seo, focusKeyword: e.target.value },
                    })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Schema.org İçerik Tipi
                </label>
                <select
                  disabled={!canManageSeo}
                  value={activePost.seo.schemaType}
                  onChange={(e) =>
                    onUpdatePost({
                      ...activePost,
                      seo: {
                        ...activePost.seo,
                        schemaType: e.target.value as BlogPost['seo']['schemaType'],
                      },
                    })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Article">Article (Standart Makale)</option>
                  <option value="TechArticle">TechArticle (Teknik Rehber)</option>
                  <option value="HowTo">HowTo (Adım Adım Kılavuz)</option>
                  <option value="NewsArticle">NewsArticle (Haber / Duyuru)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  SEO Başlığı (Title Tag)
                </label>
                <span className="font-mono text-slate-500 tabular-nums">
                  {activePost.seo.seoTitle.length} / 60 karakter
                </span>
              </div>
              <input
                type="text"
                disabled={!canManageSeo}
                value={activePost.seo.seoTitle}
                onChange={(e) =>
                  onUpdatePost({
                    ...activePost,
                    seo: { ...activePost.seo, seoTitle: e.target.value },
                  })
                }
                className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Meta Açıklama (Meta Description)
                </label>
                <span className="font-mono text-slate-500 tabular-nums">
                  {activePost.seo.metaDescription.length} / 160 karakter
                </span>
              </div>
              <textarea
                rows={3}
                disabled={!canManageSeo}
                value={activePost.seo.metaDescription}
                onChange={(e) =>
                  onUpdatePost({
                    ...activePost,
                    seo: { ...activePost.seo, metaDescription: e.target.value },
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kanonik URL (Canonical)
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={activePost.seo.canonicalUrl}
                  onChange={(e) =>
                    onUpdatePost({
                      ...activePost,
                      seo: { ...activePost.seo, canonicalUrl: e.target.value },
                    })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-end pb-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    disabled={!canManageSeo}
                    checked={activePost.seo.noIndex}
                    onChange={(e) =>
                      onUpdatePost({
                        ...activePost,
                        seo: { ...activePost.seo, noIndex: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Arama motorlarına kapat (noindex)</span>
                </label>
              </div>
            </div>

            {/* Deterministic Checklist */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Teknik ve İçerik Kontrol Listesi
                </h3>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  Yoğunluk: %{audit.keywordDensityPct} ({audit.keywordCount} eşleşme)
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {audit.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    {chk.severity === 'good' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          chk.severity === 'warn' ? 'text-amber-600' : 'text-red-600'
                        }`}
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {chk.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {chk.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 Columns: SEO Puanlama + Live Google SERP Preview + JSON-LD */}
          <div className="space-y-5 xl:col-span-2">
            <SeoScoringCard
              post={activePost}
              canManageSeo={canManageSeo}
              onApplyUpdate={(updated, msg) => {
                onUpdatePost(updated);
                showSaved(msg);
              }}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Google SERP Canlı Önizleme
                </h3>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setSerpDevice('desktop')}
                    aria-label="Masaüstü SERP önizleme"
                    className={`rounded p-1 ${
                      serpDevice === 'desktop'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSerpDevice('mobile')}
                    aria-label="Mobil SERP önizleme"
                    className={`rounded p-1 ${
                      serpDevice === 'mobile'
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div
                className={`mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 ${
                  serpDevice === 'mobile' ? 'mx-auto max-w-[340px]' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate font-mono text-[11px]">
                    {siteSeo.baseUrl} › blog › {activePost.slug}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-base font-medium text-blue-700 dark:text-blue-400">
                  {siteSeo.titleTemplate.replace(
                    '%title%',
                    activePost.seo.seoTitle || activePost.title
                  )}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 tabular-nums">{activePost.publishedAt} — </span>
                  {activePost.seo.metaDescription || activePost.excerpt}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-slate-500" />
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    JSON-LD Yapısal Veri
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedSchemaJson);
                    setCopiedSchema(true);
                    setTimeout(() => setCopiedSchema(false), 1800);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {copiedSchema ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
                {generatedSchemaJson}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. Global Site SEO & Social */}
      {subTab === 'site_settings' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Genel Site Meta Şablonları ve Doğrulama
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Yayın / Site Adı
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={siteSeo.siteName}
                  onChange={(e) => onUpdateSiteSeo({ ...siteSeo, siteName: e.target.value })}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Başlık Şablonu (%title% yer tutucusu ile)
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={siteSeo.titleTemplate}
                  onChange={(e) =>
                    onUpdateSiteSeo({ ...siteSeo, titleTemplate: e.target.value })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ana Alan Adı (Canonical Base URL)
                </label>
                <input
                  type="url"
                  disabled={!canManageSeo}
                  value={siteSeo.baseUrl}
                  onChange={(e) => onUpdateSiteSeo({ ...siteSeo, baseUrl: e.target.value })}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  X / Twitter Hesabı
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={siteSeo.twitterHandle}
                  onChange={(e) =>
                    onUpdateSiteSeo({ ...siteSeo, twitterHandle: e.target.value })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Varsayılan Site Meta Açıklaması
              </label>
              <textarea
                rows={3}
                disabled={!canManageSeo}
                value={siteSeo.defaultMetaDescription}
                onChange={(e) =>
                  onUpdateSiteSeo({ ...siteSeo, defaultMetaDescription: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Google Search Console Doğrulama Kodu
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={siteSeo.googleVerificationCode}
                  onChange={(e) =>
                    onUpdateSiteSeo({ ...siteSeo, googleVerificationCode: e.target.value })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  GA4 Ölçüm Kimliği
                </label>
                <input
                  type="text"
                  disabled={!canManageSeo}
                  value={siteSeo.analyticsMeasurementId}
                  onChange={(e) =>
                    onUpdateSiteSeo({ ...siteSeo, analyticsMeasurementId: e.target.value })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {canManageSeo && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showSaved('Genel site SEO ayarları güncellendi.')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Ayarları Kaydet</span>
                </button>
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Sosyal Medya Open Graph Önizlemesi
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ana sayfa bağlantısı paylaşıldığında görünecek kart
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <img
                src={siteSeo.defaultOgImage}
                alt={siteSeo.siteName}
                referrerPolicy="no-referrer"
                className="h-40 w-full object-cover"
              />
              <div className="bg-slate-50 p-3.5 dark:bg-slate-950">
                <p className="font-mono text-[11px] text-slate-400">
                  {siteSeo.baseUrl.replace(/^https?:\/\//, '')}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {siteSeo.siteName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                  {siteSeo.defaultMetaDescription}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Robots.txt & XML Sitemap */}
      {subTab === 'robots_sitemap' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                robots.txt Düzenleyici
              </h2>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile('robots.txt', siteSeo.robotsTxt, 'text/plain;charset=utf-8')
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>İndir</span>
              </button>
            </div>

            <textarea
              rows={9}
              disabled={!canManageSeo}
              value={siteSeo.robotsTxt}
              onChange={(e) => onUpdateSiteSeo({ ...siteSeo, robotsTxt: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 disabled:opacity-60 dark:border-slate-700"
            />

            {canManageSeo && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSiteSeo({
                      ...siteSeo,
                      robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /taslak/\n\nSitemap: ${siteSeo.baseUrl}/sitemap.xml`,
                    });
                    showSaved('Varsayılan robots.txt şablonu uygulandı.');
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Standart Şablonu Yükle
                </button>
                <button
                  type="button"
                  onClick={() => showSaved('robots.txt kuralları kaydedildi.')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                XML Site Haritası (Sitemap)
              </h2>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    'sitemap.xml',
                    generatedSitemapXml,
                    'application/xml;charset=utf-8'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>sitemap.xml İndir</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Güncelleme Sıklığı
                </label>
                <select
                  disabled={!canManageSeo}
                  value={siteSeo.sitemapFrequency}
                  onChange={(e) =>
                    onUpdateSiteSeo({
                      ...siteSeo,
                      sitemapFrequency: e.target.value as SiteSeoConfig['sitemapFrequency'],
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="hourly">Saatlik (hourly)</option>
                  <option value="daily">Günlük (daily)</option>
                  <option value="weekly">Haftalık (weekly)</option>
                </select>
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    disabled={!canManageSeo}
                    checked={siteSeo.sitemapAutoPing}
                    onChange={(e) =>
                      onUpdateSiteSeo({ ...siteSeo, sitemapAutoPing: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Yeni yayında arama motorlarına bildir</span>
                </label>
              </div>
            </div>

            <pre className="max-h-60 overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200">
              {generatedSitemapXml}
            </pre>
          </div>
        </div>
      )}

      {/* 4. Redirects */}
      {subTab === 'redirects' && (
        <div className="space-y-4">
          {canManageSeo && (
            <form
              onSubmit={handleAddRedirect}
              className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Eski yol (Örn: /eski-yazi)"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Hedef yol (Örn: /blog/yeni-yazi)"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <select
                  value={newCode}
                  onChange={(e) => setNewCode(Number(e.target.value) as 301 | 302)}
                  aria-label="Yönlendirme durum kodu"
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value={301}>301 Kalıcı</option>
                  <option value={302}>302 Geçici</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-5 py-3">Kaynak URL</th>
                    <th className="px-4 py-3">Hedef URL</th>
                    <th className="px-4 py-3">Kod</th>
                    <th className="px-4 py-3 text-right">İstek Sayısı</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {redirects.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-mono text-xs text-slate-900 dark:text-slate-100">
                        {rule.sourcePath}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                        {rule.targetPath}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {rule.statusCode}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {formatNumberTR(rule.hits)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <button
                          type="button"
                          disabled={!canManageSeo}
                          onClick={() => onToggleRedirect(rule.id)}
                          className={`font-medium ${
                            rule.active
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {rule.active ? 'Etkin' : 'Pasif'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canManageSeo && (
                          <button
                            type="button"
                            onClick={() => onDeleteRedirect(rule.id)}
                            aria-label="Yönlendirmeyi sil"
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Google Search Grounding Research */}
      {subTab === 'search_research' && activePost && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SearchResearchPanel
              key={activePost.id}
              defaultQuery={activePost.seo.focusKeyword || activePost.title}
              focusKeyword={activePost.seo.focusKeyword}
              postTitle={activePost.title}
              mode="seo_insights"
            />
          </div>
          <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Seçili Yazı Bağlamı
            </h3>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {activePost.title}
            </p>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p>
                Odak Kelime:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {activePost.seo.focusKeyword || 'Belirtilmemiş'}
                </span>
              </p>
              <p className="font-mono text-[11px]">/{activePost.slug}</p>
            </div>
            <select
              value={activePost.id}
              onChange={(e) => onSelectPostId(e.target.value)}
              aria-label="Araştırma yazısı seç"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </aside>
        </div>
      )}
    </div>
  );
};
