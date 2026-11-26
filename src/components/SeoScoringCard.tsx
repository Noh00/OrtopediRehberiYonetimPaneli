import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Wand2,
  XCircle,
} from 'lucide-react';
import { BlogPost } from '../types/admin';
import {
  evaluateSeoScoringDetails,
  SeoRecommendation,
} from '../utils/seoAudit';

interface SeoScoringCardProps {
  post: BlogPost;
  canManageSeo: boolean;
  onApplyUpdate: (updatedPost: BlogPost, feedbackMsg: string) => void;
}

export const SeoScoringCard: React.FC<SeoScoringCardProps> = ({
  post,
  canManageSeo,
  onApplyUpdate,
}) => {
  const scoring = useMemo(() => evaluateSeoScoringDetails(post), [post]);

  const handleApplyAction = (rec: SeoRecommendation) => {
    if (!canManageSeo || !rec.actionType) return;

    const currentTitle = (post.seo.seoTitle || post.title).trim();
    const currentMeta = (post.seo.metaDescription || post.excerpt).trim();
    const kw = post.seo.focusKeyword.trim();

    if (rec.actionType === 'trim_title') {
      const trimmed = currentTitle.slice(0, 59).replace(/\s+\S*$/, '').trim();
      onApplyUpdate(
        {
          ...post,
          seo: { ...post.seo, seoTitle: trimmed || currentTitle.slice(0, 60) },
        },
        'SEO başlığı 60 karakter sınırına göre kısaltıldı.'
      );
      return;
    }

    if (rec.actionType === 'add_keyword_title' && kw) {
      const nextTitle = `${kw}: ${currentTitle}`.slice(0, 62);
      onApplyUpdate(
        {
          ...post,
          seo: { ...post.seo, seoTitle: nextTitle },
        },
        'Odak anahtar kelime SEO başlığına eklendi.'
      );
      return;
    }

    if (rec.actionType === 'fill_meta_excerpt' && post.excerpt) {
      const nextMeta = post.excerpt.trim().slice(0, 158);
      onApplyUpdate(
        {
          ...post,
          seo: { ...post.seo, metaDescription: nextMeta },
        },
        'Meta açıklama yazı özetinden dolduruldu.'
      );
      return;
    }

    if (rec.actionType === 'trim_meta') {
      const trimmed = currentMeta.slice(0, 157).replace(/\s+\S*$/, '').trim();
      onApplyUpdate(
        {
          ...post,
          seo: {
            ...post.seo,
            metaDescription: trimmed ? `${trimmed}.` : currentMeta.slice(0, 158),
          },
        },
        'Meta açıklama 160 karakter sınırına göre optimize edildi.'
      );
      return;
    }

    if (rec.actionType === 'add_keyword_meta' && kw) {
      const combined = currentMeta
        ? `${kw} hakkında: ${currentMeta}`
        : `${kw} üzerine kapsamlı rehber ve uygulamalı örnekler.`;
      const nextMeta =
        combined.length > 158
          ? `${combined.slice(0, 155).replace(/\s+\S*$/, '').trim()}.`
          : combined;
      onApplyUpdate(
        {
          ...post,
          seo: { ...post.seo, metaDescription: nextMeta },
        },
        'Odak anahtar kelime meta açıklamaya eklendi.'
      );
    }
  };

  const scoreColor =
    scoring.overallScore >= 80
      ? 'text-emerald-700 dark:text-emerald-400'
      : scoring.overallScore >= 55
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const barColor =
    scoring.overallScore >= 80
      ? 'bg-emerald-600'
      : scoring.overallScore >= 55
        ? 'bg-amber-500'
        : 'bg-red-600';

  return (
    <section
      aria-label="SEO Puanlama"
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header & Overall Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              SEO Puanlama
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Başlık, anahtar kelime ve meta uzunluk denetimi
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={`font-mono text-2xl font-bold tabular-nums ${scoreColor}`}>
            {scoring.overallScore}/100
          </span>
          <p className={`text-[11px] font-medium ${scoreColor}`}>{scoring.gradeLabel}</p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${scoring.overallScore}%` }}
        />
      </div>

      {/* 3 Length & Structure Meters */}
      <div className="mt-5 space-y-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
        {scoring.metrics.map((m) => {
          const pct = Math.min(100, Math.round((m.currentLength / m.maxScale) * 100));
          const meterBarColor =
            m.status === 'good'
              ? 'bg-emerald-600'
              : m.status === 'warn'
                ? 'bg-amber-500'
                : 'bg-red-600';
          const textStatusColor =
            m.status === 'good'
              ? 'text-emerald-700 dark:text-emerald-400'
              : m.status === 'warn'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400';

          return (
            <div key={m.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {m.label}
                </span>
                <span className={`font-medium ${textStatusColor}`}>{m.statusText}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${meterBarColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                {m.currentLength} {m.unitLabel}
              </p>
            </div>
          );
        })}
      </div>

      {/* Improvement Recommendations */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>İyileştirme Önerileri ({scoring.recommendations.length})</span>
          </h4>
        </div>

        {scoring.recommendations.length === 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Başlık, odak anahtar kelime ve meta açıklama uzunlukları önerilen SEO standartlarıyla tam uyumlu.
            </span>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {scoring.recommendations.map((rec) => (
              <li
                key={rec.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start gap-2">
                  {rec.severity === 'error' ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                      {rec.area}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {rec.message}
                    </p>
                    {rec.actionLabel && rec.actionType && canManageSeo && (
                      <button
                        type="button"
                        onClick={() => handleApplyAction(rec)}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-blue-950/40"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>{rec.actionLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
