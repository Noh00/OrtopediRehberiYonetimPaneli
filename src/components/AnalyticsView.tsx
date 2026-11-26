import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet } from 'lucide-react';
import {
  BlogPost,
  Category,
  DailyTrafficPoint,
  TeamUser,
} from '../types/admin';
import {
  downloadTextFile,
  formatDurationTR,
  formatNumberTR,
} from '../utils/seoAudit';

interface AnalyticsViewProps {
  posts: BlogPost[];
  categories: Category[];
  users: TeamUser[];
  trafficSeries: DailyTrafficPoint[];
  canExport: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  posts,
  categories,
  users,
  trafficSeries,
  canExport,
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'views' | 'organicViews' | 'avgReadDurationSec'>('views');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const multiplier = period === '7d' ? 0.28 : period === '90d' ? 2.85 : 1;

  const filteredPosts = useMemo(() => {
    const base =
      categoryFilter === 'all'
        ? posts
        : posts.filter((p) => p.categoryId === categoryFilter);
    return [...base].sort((a, b) => {
      const diff = a[sortBy] - b[sortBy];
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [posts, categoryFilter, sortBy, sortDir]);

  const seriesData = useMemo(() => {
    if (period === '7d') return trafficSeries.slice(-7);
    if (period === '30d') return trafficSeries;
    return trafficSeries.map((pt) => ({
      ...pt,
      totalViews: Math.round(pt.totalViews * 1.15),
      organicViews: Math.round(pt.organicViews * 1.18),
      uniqueVisitors: Math.round(pt.uniqueVisitors * 1.14),
    }));
  }, [trafficSeries, period]);

  const totalViews = Math.round(
    filteredPosts.reduce((acc, p) => acc + p.views, 0) * multiplier
  );
  const totalOrganic = Math.round(
    filteredPosts.reduce((acc, p) => acc + p.organicViews, 0) * multiplier
  );
  const uniqueVisitors = Math.round(totalViews * 0.74);

  const publishedWithDuration = filteredPosts.filter((p) => p.avgReadDurationSec > 0);
  const avgDuration =
    publishedWithDuration.length > 0
      ? Math.round(
          publishedWithDuration.reduce((a, p) => a + p.avgReadDurationSec, 0) /
            publishedWithDuration.length
        )
      : 210;
  const avgBounce =
    publishedWithDuration.length > 0
      ? (
          publishedWithDuration.reduce((a, p) => a + p.bounceRate, 0) /
          publishedWithDuration.length
        ).toFixed(1)
      : '34.2';

  const channels = [
    { name: 'Organik Arama (Google / Bing)', share: 58, sessions: Math.round(uniqueVisitors * 0.58), color: '#2563EB' },
    { name: 'Doğrudan Ziyaret', share: 20, sessions: Math.round(uniqueVisitors * 0.2), color: '#0D9488' },
    { name: 'E-posta Bülteni', share: 11, sessions: Math.round(uniqueVisitors * 0.11), color: '#4F46E5' },
    { name: 'Sosyal Medya (X / LinkedIn)', share: 8, sessions: Math.round(uniqueVisitors * 0.08), color: '#D97706' },
    { name: 'Yönlendirme (Referral)', share: 3, sessions: Math.round(uniqueVisitors * 0.03), color: '#64748B' },
  ];

  const categoryPerf = categories.map((cat) => {
    const catPosts = posts.filter((p) => p.categoryId === cat.id);
    const views = catPosts.reduce((a, p) => a + p.views, 0);
    const organic = catPosts.reduce((a, p) => a + p.organicViews, 0);
    return {
      ...cat,
      postCount: catPosts.length,
      views: Math.round(views * multiplier),
      organicPct: views > 0 ? Math.round((organic / views) * 100) : 0,
    };
  });

  const authorPerf = users
    .filter((u) => u.postsPublished > 0)
    .map((u) => {
      const authored = posts.filter((p) => p.authorId === u.id);
      const views = authored.reduce((a, p) => a + p.views, 0);
      const comments = authored.reduce((a, p) => a + p.commentsCount, 0);
      return {
        ...u,
        activeCount: authored.length,
        views: Math.round(views * multiplier),
        comments,
      };
    })
    .sort((a, b) => b.views - a.views);

  const handleExportCsv = () => {
    if (!canExport) return;
    const header = 'Baslik;Slug;Durum;Okunma;Organik Okunma;Ort Okuma Suresi (sn);Hemen Cikma (%)\n';
    const rows = filteredPosts
      .map(
        (p) =>
          `"${p.title.replace(/"/g, '""')}";"${p.slug}";"${p.status}";${p.views};${p.organicViews};${p.avgReadDurationSec};${p.bounceRate}`
      )
      .join('\n');
    downloadTextFile(`kalemdesk-rapor-${period}.csv`, '\uFEFF' + header + rows, 'text/csv;charset=utf-8');
  };

  const handleExportJson = () => {
    if (!canExport) return;
    const payload = {
      generatedAt: '2026-11-26T09:45:00Z',
      period,
      summary: { totalViews, uniqueVisitors, totalOrganic, avgDuration, avgBounce },
      posts: filteredPosts.map((p) => ({
        title: p.title,
        slug: p.slug,
        views: p.views,
        organicViews: p.organicViews,
        bounceRate: p.bounceRate,
      })),
    };
    downloadTextFile(
      `kalemdesk-analitik-${period}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  // SVG chart geometry
  const W = 700;
  const H = 210;
  const px = 24;
  const py = 18;
  const maxY = Math.max(...seriesData.map((d) => d.totalViews), 100);
  const pts = seriesData.map((d, i) => ({
    x: seriesData.length === 1 ? W / 2 : px + (i / (seriesData.length - 1)) * (W - px * 2),
    yTotal: H - py - (d.totalViews / maxY) * (H - py * 2),
    yOrg: H - py - (d.organicViews / maxY) * (H - py * 2),
    d,
  }));
  const pathTotal = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yTotal.toFixed(1)}`).join(' ');
  const pathOrg = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yOrg.toFixed(1)}`).join(' ');
  const activePt = hoverIdx !== null && pts[hoverIdx] ? pts[hoverIdx] : pts[pts.length - 1];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { id: '7d', label: 'Son 7 Gün' },
              { id: '30d', label: 'Son 30 Gün' },
              { id: '90d', label: 'Son 90 Gün' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id as '7d' | '30d' | '90d')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  period === item.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Kategoriye göre filtrele"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canExport}
            onClick={handleExportCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV Dışa Aktar</span>
          </button>
          <button
            type="button"
            disabled={!canExport}
            onClick={handleExportJson}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON İndir</span>
          </button>
        </div>
      </div>

      {/* Statistical KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sayfa Görüntüleme
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {formatNumberTR(totalViews)}
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            +16,2% önceki döneme göre
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tekil Okur Sayısı
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {formatNumberTR(uniqueVisitors)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {formatNumberTR(totalOrganic)} organik arama kaynaklı
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ortalama Okuma Süresi
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            {formatDurationTR(avgDuration)}
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            +14 sn etkileşim artışı
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Hemen Çıkma Oranı
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-white">
            %{avgBounce}
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            -2,4 puan iyileşme
          </p>
        </div>
      </div>

      {/* Multi-Series Chart & Acquisition Channels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Trafik ve Organik Büyüme Analizi
            </h2>
            {activePt && (
              <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                <span className="text-slate-500">{activePt.d.label}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Toplam: {formatNumberTR(activePt.d.totalViews)}
                </span>
                <span className="text-teal-600 dark:text-teal-400">
                  Organik: {formatNumberTR(activePt.d.organicViews)}
                </span>
              </div>
            )}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-52 w-full overflow-visible">
            {[0.25, 0.5, 0.75, 1].map((r) => {
              const y = H - py - r * (H - py * 2);
              return (
                <line
                  key={r}
                  x1={px}
                  y1={y}
                  x2={W - px}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray="3 3"
                />
              );
            })}
            <path d={pathTotal} fill="none" stroke="#2563EB" strokeWidth="2.2" />
            <path d={pathOrg} fill="none" stroke="#0D9488" strokeWidth="2" strokeDasharray="4 3" />
            {pts.map((p, idx) => (
              <g key={p.d.date}>
                <circle
                  cx={p.x}
                  cy={p.yTotal}
                  r={hoverIdx === idx ? 5 : 2.5}
                  fill="#2563EB"
                />
                <rect
                  x={p.x - 10}
                  y={0}
                  width={20}
                  height={H}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="cursor-crosshair"
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Trafik Kanalları Dağılımı
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Dönem içi kaynak bazlı ziyaretçi payları
          </p>
          <div className="mt-5 space-y-4">
            {channels.map((ch) => (
              <div key={ch.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {ch.name}
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    %{ch.share} · {formatNumberTR(ch.sessions)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ch.share}%`, backgroundColor: ch.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category & Author Breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Kategori Bazlı Performans
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-5 py-2.5">Kategori</th>
                <th className="px-4 py-2.5 text-right">Yazı</th>
                <th className="px-4 py-2.5 text-right">Okunma</th>
                <th className="px-5 py-2.5 text-right">Organik Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categoryPerf.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {cat.postCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {formatNumberTR(cat.views)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-teal-700 dark:text-teal-400">
                    %{cat.organicPct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Yazar Verimliliği ve Etkileşim
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-5 py-2.5">Yazar</th>
                <th className="px-4 py-2.5 text-right">Toplam Yayın</th>
                <th className="px-4 py-2.5 text-right">Dönem Okuma</th>
                <th className="px-5 py-2.5 text-right">Yorum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {authorPerf.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {u.postsPublished}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {formatNumberTR(u.views)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {u.comments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article Performance Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            İçerik Bazlı Detaylı Performans Raporu
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-5 py-3">Yazı Başlığı</th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('views')}
                    className="inline-flex items-center gap-1 font-medium hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Okunma</span>
                    {sortBy === 'views' &&
                      (sortDir === 'desc' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('organicViews')}
                    className="inline-flex items-center gap-1 font-medium hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Organik Arama</span>
                    {sortBy === 'organicViews' &&
                      (sortDir === 'desc' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('avgReadDurationSec')}
                    className="inline-flex items-center gap-1 font-medium hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Ort. Süre</span>
                    {sortBy === 'avgReadDurationSec' &&
                      (sortDir === 'desc' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      ))}
                  </button>
                </th>
                <th className="px-5 py-3 text-right">Hemen Çıkma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPosts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {formatNumberTR(Math.round(p.views * multiplier))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-teal-700 dark:text-teal-400">
                    {formatNumberTR(Math.round(p.organicViews * multiplier))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {p.avgReadDurationSec > 0 ? formatDurationTR(p.avgReadDurationSec) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {p.bounceRate > 0 ? `%${p.bounceRate}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
