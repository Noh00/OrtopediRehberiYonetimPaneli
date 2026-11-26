import React, { useState } from 'react';
import { ArrowUpRight, Calendar, Edit3, Globe, ShieldAlert } from 'lucide-react';
import {
  BlogPost,
  Category,
  DailyTrafficPoint,
  ModerationComment,
  NavSection,
  TeamTask,
  TeamUser,
} from '../types/admin';
import { evaluatePostSeo, formatNumberTR } from '../utils/seoAudit';
import { SafeImage } from './SafeImage';

interface OverviewViewProps {
  posts: BlogPost[];
  categories: Category[];
  users: TeamUser[];
  comments: ModerationComment[];
  tasks: TeamTask[];
  trafficSeries: DailyTrafficPoint[];
  onNavigate: (section: NavSection) => void;
  onEditPost: (post: BlogPost) => void;
  onInspectPostSeo: (postId: string) => void;
}

const POST_STATUS_LABELS: Record<BlogPost['status'], string> = {
  published: 'Yayında',
  draft: 'Taslak',
  review: 'İncelemede',
  scheduled: 'Zamanlandı',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  posts,
  categories,
  users,
  comments,
  tasks,
  trafficSeries,
  onNavigate,
  onEditPost,
  onInspectPostSeo,
}) => {
  const [range, setRange] = useState<'7d' | '30d'>('30d');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visibleSeries = range === '7d' ? trafficSeries.slice(-7) : trafficSeries;
  const totalViews = posts.reduce((acc, p) => acc + p.views, 0);
  const totalOrganic = posts.reduce((acc, p) => acc + p.organicViews, 0);
  const organicShare = totalViews > 0 ? Math.round((totalOrganic / totalViews) * 100) : 0;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const pendingComments = comments.filter((c) => c.status === 'pending').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;

  const avgSeoScore =
    posts.length > 0
      ? Math.round(posts.reduce((acc, p) => acc + evaluatePostSeo(p).score, 0) / posts.length)
      : 0;

  // SVG chart dimensions
  const chartW = 720;
  const chartH = 220;
  const padX = 28;
  const padY = 20;
  const maxVal = Math.max(...visibleSeries.map((d) => d.totalViews), 100);

  const pointsTotal = visibleSeries.map((d, idx) => {
    const x =
      visibleSeries.length === 1
        ? chartW / 2
        : padX + (idx / (visibleSeries.length - 1)) * (chartW - padX * 2);
    const y = chartH - padY - (d.totalViews / maxVal) * (chartH - padY * 2);
    return { x, y, data: d };
  });

  const pointsOrganic = visibleSeries.map((d, idx) => {
    const x =
      visibleSeries.length === 1
        ? chartW / 2
        : padX + (idx / (visibleSeries.length - 1)) * (chartW - padX * 2);
    const y = chartH - padY - (d.organicViews / maxVal) * (chartH - padY * 2);
    return { x, y };
  });

  const totalLinePath = pointsTotal
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const organicLinePath = pointsOrganic
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    pointsTotal.length > 0
      ? `${totalLinePath} L ${pointsTotal[pointsTotal.length - 1].x.toFixed(1)} ${(chartH - padY).toFixed(1)} L ${pointsTotal[0].x.toFixed(1)} ${(chartH - padY).toFixed(1)} Z`
      : '';

  const activePoint =
    hoveredIdx !== null && pointsTotal[hoveredIdx]
      ? pointsTotal[hoveredIdx]
      : pointsTotal[pointsTotal.length - 1];

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section aria-label="Temel yayın metrikleri" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Toplam Makale Okunması
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {formatNumberTR(totalViews)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {posts.length > 0
              ? `Yayında ${publishedCount} makale`
              : 'Şu anda Herhangi bir veri bulunamadı'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Yayın Durumu ve SEO Hazırlığı
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {publishedCount} / {posts.length}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Ortalama SEO uyumu %{avgSeoScore}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Organik Arama Payı
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            %{organicShare}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {formatNumberTR(totalOrganic)} arama motoru ziyareti
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Bekleyen Ekip Aksiyonları
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {pendingComments + openTasks}
          </p>
          <p className="mt-1.5 text-xs text-amber-700 tabular-nums dark:text-amber-400">
            {pendingComments} yorum onayı · {openTasks} açık görev
          </p>
        </div>
      </section>

      {/* Main Chart + Workflow Rail */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Okunma ve Organik Trafik Eğilimi
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Günlük toplam görüntülenme ile arama motorlarından gelen organik trafik karşılaştırması
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRange('7d')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  range === '7d'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Son 7 Gün
              </button>
              <button
                type="button"
                onClick={() => setRange('30d')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  range === '30d'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Son 30 Gün
              </button>
            </div>
          </div>

          {activePoint && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-2.5 text-xs dark:border-slate-800">
              <span className="font-medium text-slate-700 tabular-nums dark:text-slate-300">
                Tarih: {activePoint.data.label} ({activePoint.data.date})
              </span>
              <div className="flex items-center gap-5 tabular-nums">
                <span className="font-mono text-blue-700 dark:text-blue-400">
                  Toplam: {formatNumberTR(activePoint.data.totalViews)}
                </span>
                <span className="font-mono text-teal-700 dark:text-teal-400">
                  Organik: {formatNumberTR(activePoint.data.organicViews)}
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Tekil: {formatNumberTR(activePoint.data.uniqueVisitors)}
                </span>
              </div>
            </div>
          )}

          {visibleSeries.length === 0 ? (
            <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </div>
          ) : (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="h-56 w-full overflow-visible"
                role="img"
                aria-label="Günlük okunma ve organik trafik grafiği"
              >
                <defs>
                  <linearGradient id="overviewTotalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartH - padY - ratio * (chartH - padY * 2);
                  return (
                    <line
                      key={ratio}
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                      strokeDasharray="3 3"
                    />
                  );
                })}

                {areaPath && <path d={areaPath} fill="url(#overviewTotalFill)" />}
                {totalLinePath && (
                  <path
                    d={totalLinePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {organicLinePath && (
                  <path
                    d={organicLinePath}
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                )}

                {pointsTotal.map((pt, idx) => (
                  <g key={pt.data.date}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIdx === idx ? 5 : 2.5}
                      fill="#2563EB"
                      className="transition-all"
                    />
                    <rect
                      x={pt.x - 10}
                      y={0}
                      width={20}
                      height={chartH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="cursor-crosshair"
                    />
                  </g>
                ))}
              </svg>
              <div className="mt-1 flex items-center justify-between px-4 text-[11px] text-slate-400 tabular-nums">
                <span>{visibleSeries[0]?.label}</span>
                <span>{visibleSeries[Math.floor(visibleSeries.length / 2)]?.label}</span>
                <span>{visibleSeries[visibleSeries.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actionable Team Queue */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Yaklaşan Ekip Görevleri
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>Takvimi Aç</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.filter((t) => t.status !== 'done').length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Şu anda Herhangi bir veri bulunamadı
              </div>
            ) : (
              tasks
                .filter((t) => t.status !== 'done')
                .slice(0, 4)
                .map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <div key={task.id} className="py-3 first:pt-1 last:pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {task.title}
                        </p>
                        <span
                          className={`shrink-0 text-[11px] font-medium ${
                            task.priority === 'urgent'
                              ? 'text-red-600 dark:text-red-400'
                              : task.priority === 'high'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {task.priority === 'urgent'
                            ? 'Acil'
                            : task.priority === 'high'
                              ? 'Yüksek'
                              : 'Orta'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{assignee?.name ?? 'Atanmamış'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Moderasyon Kuyruğu
              </span>
              <button
                type="button"
                onClick={() => onNavigate('moderation')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {pendingComments} bekliyor →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Son Yazılar ve SEO Durumu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Yayındaki ve inceleme aşamasındaki son makaleler
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('posts')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Tüm Yazılar →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-5 py-3">Başlık</th>
                <th className="px-4 py-3">Yazar</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">Okunma</th>
                <th className="px-4 py-3 text-right">SEO Uyumu</th>
                <th className="px-5 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                    Şu anda Herhangi bir veri bulunamadı
                  </td>
                </tr>
              ) : (
                posts.slice(0, 5).map((post) => {
                  const author = users.find((u) => u.id === post.authorId);
                  const category = categories.find((c) => c.id === post.categoryId);
                  const audit = evaluatePostSeo(post);

                  return (
                    <tr
                      key={post.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={post.coverImage}
                            alt={post.coverAlt}
                            fallbackLabel={post.title}
                            className="h-10 w-14 shrink-0 rounded-md object-cover"
                          />
                          <div className="min-w-0">
                            <p className="max-w-md truncate font-medium text-slate-900 dark:text-slate-100">
                              {post.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {category?.name ?? 'Genel'} · {post.readTimeMin} dk okuma · {post.publishedAt}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {author?.name ?? 'Ekip'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            post.status === 'published'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : post.status === 'review'
                                ? 'text-amber-700 dark:text-amber-400'
                                : post.status === 'scheduled'
                                  ? 'text-blue-700 dark:text-blue-400'
                                  : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {POST_STATUS_LABELS[post.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {formatNumberTR(post.views)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        <span
                          className={
                            audit.score >= 80
                              ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                              : audit.score >= 55
                                ? 'font-semibold text-amber-700 dark:text-amber-400'
                                : 'font-semibold text-red-600 dark:text-red-400'
                          }
                        >
                          %{audit.score}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
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
                            onClick={() => onInspectPostSeo(post.id)}
                            title="SEO denetimini aç"
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
