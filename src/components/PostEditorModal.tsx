import React, { useMemo, useRef, useState } from 'react';
import {
  Bold,
  CheckCircle2,
  Code,
  Eye,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { SearchResearchPanel } from './SearchResearchPanel';
import {
  BlogPost,
  Category,
  MediaAsset,
  PostStatus,
  TagItem,
  TeamUser,
} from '../types/admin';
import { evaluatePostSeo, slugifyTurkish } from '../utils/seoAudit';
import { SafeImage } from './SafeImage';

interface PostEditorModalProps {
  initialPost: BlogPost | null;
  categories: Category[];
  tags: TagItem[];
  users: TeamUser[];
  mediaAssets: MediaAsset[];
  currentUserId: string;
  canPublish: boolean;
  onSave: (post: BlogPost, isNew: boolean) => void;
  onClose: () => void;
}

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  initialPost,
  categories,
  tags,
  users,
  mediaAssets,
  currentUserId,
  canPublish,
  onSave,
  onClose,
}) => {
  const isNew = !initialPost;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [draft, setDraft] = useState<BlogPost>(() => {
    if (initialPost) return initialPost;
    const defaultCover = mediaAssets[0];
    return {
      id: `post-${Date.now()}`,
      title: '',
      slug: '',
      excerpt: '',
      content: '## Giriş\n\nYazınızın ana fikrini ve okura sunacağınız değeri burada paylaşın.',
      categoryId: categories[0]?.id ?? 'cat-tech',
      tags: [],
      authorId: currentUserId,
      status: 'draft',
      coverImage: defaultCover?.url ?? '',
      coverAlt: defaultCover?.altText ?? '',
      publishedAt: '2026-11-26',
      updatedAt: '2026-11-26',
      readTimeMin: 4,
      views: 0,
      organicViews: 0,
      avgReadDurationSec: 0,
      bounceRate: 0,
      commentsCount: 0,
      featured: false,
      seo: {
        focusKeyword: '',
        seoTitle: '',
        metaDescription: '',
        canonicalUrl: '',
        noIndex: false,
        ogTitle: '',
        ogDescription: '',
        schemaType: 'Article',
      },
    };
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [slugLocked, setSlugLocked] = useState(!isNew);
  const [customTag, setCustomTag] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const audit = useMemo(() => evaluatePostSeo(draft), [draft]);

  const handleTitleChange = (val: string) => {
    setDraft((prev) => {
      const nextSlug = slugLocked ? prev.slug : slugifyTurkish(val);
      return {
        ...prev,
        title: val,
        slug: nextSlug,
        seo: {
          ...prev.seo,
          seoTitle: prev.seo.seoTitle || val,
        },
      };
    });
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.content.slice(start, end) || 'metin';
    const nextText =
      draft.content.slice(0, start) + prefix + selected + suffix + draft.content.slice(end);

    const words = nextText.trim().split(/\s+/).filter(Boolean).length;
    setDraft((prev) => ({
      ...prev,
      content: nextText,
      readTimeMin: Math.max(1, Math.round(words / 180)),
    }));
  };

  const toggleTag = (tagName: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const handleAddCustomTag = () => {
    const clean = customTag.trim();
    if (!clean) return;
    if (!draft.tags.includes(clean)) {
      setDraft((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setCustomTag('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.title.trim().length < 4) {
      setErrorMsg('Lütfen en az 4 karakterlik bir yazı başlığı girin.');
      return;
    }
    const finalSlug = draft.slug.trim() || slugifyTurkish(draft.title);
    const words = draft.content.trim().split(/\s+/).filter(Boolean).length;

    const finalPost: BlogPost = {
      ...draft,
      slug: finalSlug,
      readTimeMin: Math.max(1, Math.round(words / 180)),
      updatedAt: '2026-11-26',
      seo: {
        ...draft.seo,
        seoTitle: draft.seo.seoTitle || draft.title,
        metaDescription: draft.seo.metaDescription || draft.excerpt,
        canonicalUrl:
          draft.seo.canonicalUrl || `https://kalemdesk.com/blog/${finalSlug}`,
        ogTitle: draft.seo.ogTitle || draft.seo.seoTitle || draft.title,
        ogDescription:
          draft.seo.ogDescription || draft.seo.metaDescription || draft.excerpt,
      },
    };
    onSave(finalPost, isNew);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {isNew ? 'Yeni Blog Yazısı Oluştur' : 'Blog Yazısını Düzenle'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              İçerik, yayın durumu ve canlı SEO denetimini tek ekrandan yönetin.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResearchOpen((r) => !r)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                researchOpen
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Web Araştırması</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                previewMode
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{previewMode ? 'Editöre Dön' : 'Canlı Önizleme'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Editörü kapat"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-3">
            {/* Left 2 Columns: Main Content Editor */}
            <div className="space-y-5 border-b border-slate-200 p-6 lg:col-span-2 lg:border-r lg:border-b-0 dark:border-slate-800">
              {researchOpen && (
                <SearchResearchPanel
                  defaultQuery={draft.seo.focusKeyword || draft.title}
                  focusKeyword={draft.seo.focusKeyword}
                  postTitle={draft.title}
                  mode="article_fact_check"
                  onInsertSnippet={(snippet) => {
                    setDraft((prev) => ({
                      ...prev,
                      content: `${prev.content}\n\n## Güncel Araştırma Notları\n\n${snippet}`,
                    }));
                    setResearchOpen(false);
                  }}
                />
              )}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Yazı Başlığı
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: 2026 İçin Etkili İçerik Mimarisi ve SEO Stratejileri"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kalıcı URL (Slug)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSlugLocked(false);
                      setDraft((prev) => ({ ...prev, slug: slugifyTurkish(prev.title) }));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Başlıktan Yenile</span>
                  </button>
                </div>
                <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <span className="border-r border-slate-200 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    kalemdesk.com/blog/
                  </span>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setDraft((prev) => ({ ...prev, slug: slugifyTurkish(e.target.value) }));
                    }}
                    className="w-full bg-transparent px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kısa Özet (Spot Metin)
                </label>
                <textarea
                  rows={2}
                  value={draft.excerpt}
                  onChange={(e) => setDraft((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Liste sayfalarında ve sosyal paylaşımlarda görünecek kısa özet..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Makale İçeriği (Markdown)
                  </label>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {audit.wordCount} kelime · ~{Math.max(1, Math.round(audit.wordCount / 180))} dk okuma
                  </span>
                </div>

                {!previewMode ? (
                  <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => insertFormatting('## ', '')}
                        title="H2 Alt Başlık"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Heading2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        title="Kalın"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        title="İtalik"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n> ', '')}
                        title="Alıntı"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n- ', '')}
                        title="Madde İşareti"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('`', '`')}
                        title="Kod"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Code className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('[', '](/blog/ornek-yazi)')}
                        title="İç Bağlantı Ekle"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertFormatting(`\n![${draft.coverAlt || 'Görsel'}](${draft.coverImage})\n`)
                        }
                        title="Görsel Bağlantısı Ekle"
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={11}
                      value={draft.content}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, content: e.target.value }))
                      }
                      className="w-full resize-y bg-white p-4 font-sans text-sm leading-relaxed text-slate-800 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                ) : (
                  <div className="mt-1.5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/40">
                    {draft.coverImage && (
                      <SafeImage
                        src={draft.coverImage}
                        alt={draft.coverAlt || draft.title}
                        fallbackLabel={draft.title}
                        className="h-52 w-full rounded-lg object-cover"
                      />
                    )}
                    <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {draft.title || 'Başlıksız Taslak'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{draft.excerpt}</p>
                    <div className="space-y-3 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-800 dark:border-slate-700 dark:text-slate-200">
                      {draft.content.split('\n\n').map((block, i) => {
                        if (block.startsWith('## ')) {
                          return (
                            <h4
                              key={i}
                              className="pt-2 font-display text-lg font-semibold text-slate-900 dark:text-white"
                            >
                              {block.replace(/^##\s+/, '')}
                            </h4>
                          );
                        }
                        return <p key={i}>{block}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Publishing, Taxonomy, Media & Live SEO */}
            <div className="space-y-5 bg-slate-50/60 p-6 dark:bg-slate-950/40">
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Yayın Ayarları
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Durum
                    </label>
                    <select
                      value={draft.status}
                      onChange={(e) => {
                        const next = e.target.value as PostStatus;
                        if (next === 'published' && !canPublish) return;
                        setDraft((prev) => ({ ...prev, status: next }));
                      }}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="draft">Taslak</option>
                      <option value="review">İncelemeye Gönder</option>
                      <option value="scheduled">Zamanlandı</option>
                      <option value="published" disabled={!canPublish}>
                        Yayında {!canPublish ? '(Yetki Yok)' : ''}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Yayın / Plan Tarihi
                    </label>
                    <input
                      type="date"
                      value={draft.scheduledFor || draft.publishedAt}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          publishedAt: e.target.value,
                          scheduledFor:
                            prev.status === 'scheduled' ? e.target.value : prev.scheduledFor,
                        }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={draft.categoryId}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Yazar
                    </label>
                    <select
                      value={draft.authorId}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, authorId: e.target.value }))
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cover Media */}
              <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-900 dark:text-white">
                  Kapak Görseli
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {mediaAssets.slice(0, 3).map((asset) => {
                    const active = draft.coverImage === asset.url;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            coverImage: asset.url,
                            coverAlt: prev.coverAlt || asset.altText,
                          }))
                        }
                        className={`overflow-hidden rounded-lg border-2 transition-all ${
                          active
                            ? 'border-blue-600'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <SafeImage
                          src={asset.url}
                          alt={asset.altText}
                          className="h-14 w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={draft.coverAlt}
                  onChange={(e) => setDraft((prev) => ({ ...prev, coverAlt: e.target.value }))}
                  placeholder="Görsel alt metni (SEO için önemli)"
                  className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-900 dark:text-white">
                  Etiketler
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => {
                    const active = draft.tags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.name)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="Özel etiket ekle..."
                    className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Inline SEO Audit */}
              <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Canlı SEO Denetimi
                  </h3>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      audit.score >= 80
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : audit.score >= 55
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    %{audit.score} Uyum
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Odak Anahtar Kelime
                  </label>
                  <input
                    type="text"
                    value={draft.seo.focusKeyword}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, focusKeyword: e.target.value },
                      }))
                    }
                    placeholder="Örn: Teknik SEO"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>SEO Başlığı</span>
                    <span className="font-mono tabular-nums">
                      {(draft.seo.seoTitle || draft.title).length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={draft.seo.seoTitle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, seoTitle: e.target.value },
                      }))
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Meta Açıklama</span>
                    <span className="font-mono tabular-nums">
                      {(draft.seo.metaDescription || draft.excerpt).length}/160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={draft.seo.metaDescription}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <ul className="space-y-1.5 pt-1">
                  {audit.checks.map((chk) => (
                    <li key={chk.id} className="flex items-start gap-2 text-[11px]">
                      <CheckCircle2
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          chk.severity === 'good'
                            ? 'text-emerald-600'
                            : chk.severity === 'warn'
                              ? 'text-amber-600'
                              : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                      <span className="text-slate-600 dark:text-slate-300">
                        <strong className="font-medium text-slate-800 dark:text-slate-100">
                          {chk.label}:
                        </strong>{' '}
                        {chk.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isNew ? 'Yeni taslak kaydedilmeye hazır' : `Son güncelleme: ${draft.updatedAt}`}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isNew ? 'Yazıyı Kaydet' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
