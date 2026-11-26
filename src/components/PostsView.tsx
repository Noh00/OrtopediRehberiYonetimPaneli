import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Edit3,
  Globe,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import {
  BlogPost,
  Category,
  PostStatus,
  TeamUser,
} from '../types/admin';
import { evaluatePostSeo, formatNumberTR } from '../utils/seoAudit';
import { SafeImage } from './SafeImage';

interface PostsViewProps {
  posts: BlogPost[];
  categories: Category[];
  users: TeamUser[];
  globalSearch: string;
  canPublish: boolean;
  canDelete: boolean;
  onNewPost: () => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onBulkUpdateStatus: (ids: string[], status: PostStatus) => void;
  onBulkDelete: (ids: string[]) => void;
  onToggleFeatured: (postId: string) => void;
  onInspectSeo: (postId: string) => void;
}

const STATUS_TABS: { id: PostStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'published', label: 'Yayında' },
  { id: 'review', label: 'İncelemede' },
  { id: 'scheduled', label: 'Zamanlandı' },
  { id: 'draft', label: 'Taslak' },
];

const STATUS_TEXT: Record<PostStatus, string> = {
  published: 'Yayında',
  review: 'İncelemede',
  scheduled: 'Zamanlandı',
  draft: 'Taslak',
};

export const PostsView: React.FC<PostsViewProps> = ({
  posts,
  categories,
  users,
  globalSearch,
  canPublish,
  canDelete,
  onNewPost,
  onEditPost,
  onDeletePost,
  onBulkUpdateStatus,
  onBulkDelete,
  onToggleFeatured,
  onInspectSeo,
}) => {
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localQuery, setLocalQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const effectiveQuery = (localQuery || globalSearch).trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && post.categoryId !== categoryFilter) return false;
      if (effectiveQuery) {
        const match =
          post.title.toLowerCase().includes(effectiveQuery) ||
          post.slug.toLowerCase().includes(effectiveQuery) ||
          post.tags.some((t) => t.toLowerCase().includes(effectiveQuery));
        if (!match) return false;
      }
      return true;
    });
  }, [posts, statusFilter, categoryFilter, effectiveQuery]);

  const allVisibleSelected =
    filteredPosts.length > 0 && filteredPosts.every((p) => selectedIds.includes(p.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPosts.map((p) => p.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? posts.length
                : posts.filter((p) => p.status === tab.id).length;
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Başlık, slug veya etiket..."
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Kategori filtresi"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onNewPost}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Yazı Oluştur</span>
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs dark:border-blue-900 dark:bg-blue-950/30">
          <span className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-200">
            <CheckSquare className="h-4 w-4" />
            <span className="tabular-nums">{selectedIds.length} yazı seçildi</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {canPublish && (
              <button
                type="button"
                onClick={() => {
                  onBulkUpdateStatus(selectedIds, 'published');
                  setSelectedIds([]);
                }}
                className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-800 shadow-xs hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
              >
                Toplu Yayınla
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onBulkUpdateStatus(selectedIds, 'draft');
                setSelectedIds([]);
              }}
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-800 shadow-xs hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
            >
              Taslağa Çek
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
              >
                Seçilenleri Sil
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filteredPosts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Şu anda Herhangi bir veri bulunamadı
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Yeni bir blog yazısı oluşturarak yayın akışınızı başlatabilirsiniz.
            </p>
            <button
              type="button"
              onClick={onNewPost}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Yazıyı Oluştur</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Tüm yazıları seç"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </th>
                  <th className="px-4 py-3">Yazı ve Bağlantı</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Yazar</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">Okunma</th>
                  <th className="px-4 py-3 text-right">SEO</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPosts.map((post) => {
                  const category = categories.find((c) => c.id === post.categoryId);
                  const author = users.find((u) => u.id === post.authorId);
                  const audit = evaluatePostSeo(post);

                  return (
                    <tr
                      key={post.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(post.id)}
                          onChange={() => toggleOne(post.id)}
                          aria-label={`${post.title} yazısını seç`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={post.coverImage}
                            alt={post.coverAlt}
                            fallbackLabel={post.title}
                            className="h-11 w-16 shrink-0 rounded-md object-cover"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onEditPost(post)}
                              className="max-w-sm truncate text-left font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                            >
                              {post.title}
                            </button>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                              /{post.slug} · {post.tags.slice(0, 2).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap dark:text-slate-300">
                        {category?.name ?? 'Genel'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap dark:text-slate-300">
                        {author?.name ?? 'Ekip'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs">
                          <span
                            className={`font-medium ${
                              post.status === 'published'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : post.status === 'review'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : post.status === 'scheduled'
                                    ? 'text-blue-700 dark:text-blue-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {STATUS_TEXT[post.status]}
                          </span>
                          <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                            {post.scheduledFor || post.publishedAt}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {formatNumberTR(post.views)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        <button
                          type="button"
                          onClick={() => onInspectSeo(post.id)}
                          className={`font-semibold underline-offset-2 hover:underline ${
                            audit.score >= 80
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : audit.score >= 55
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          %{audit.score}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleFeatured(post.id)}
                            title={post.featured ? 'Öne çıkanlardan kaldır' : 'Öne çıkar'}
                            className={`rounded-md p-1.5 transition-colors ${
                              post.featured
                                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditPost(post)}
                            title="Yazıyı düzenle"
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectSeo(post.id)}
                            title="SEO ayarlarını aç"
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDeletePost(post.id)}
                              title="Yazıyı sil"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
