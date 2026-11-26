import React, { useState } from 'react';
import { ExternalLink, Globe, Loader2, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface GroundedSource {
  title: string;
  uri: string;
}

interface SearchGroundedResponse {
  summaryMarkdown: string;
  sources: GroundedSource[];
}

interface SearchResearchPanelProps {
  defaultQuery?: string;
  focusKeyword?: string;
  postTitle?: string;
  mode?: 'seo_insights' | 'article_fact_check';
  onInsertSnippet?: (snippet: string) => void;
}

export const SearchResearchPanel: React.FC<SearchResearchPanelProps> = ({
  defaultQuery = '',
  focusKeyword = '',
  postTitle = '',
  mode = 'seo_insights',
  onInsertSnippet,
}) => {
  const [query, setQuery] = useState(defaultQuery || focusKeyword || postTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchGroundedResponse | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SearchGroundedResponse>('/api/seo/research', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          focusKeyword,
          postTitle,
          mode,
        }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Google Arama araştırması tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              {mode === 'article_fact_check'
                ? 'Güncel Web Kaynağı Araştırması'
                : 'Google Arama Trend ve Rakip Analizi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Canlı Google Arama verileriyle güncel alt başlıklar ve doğrulanmış kaynaklar getirin.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleResearch} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Araştırılacak konu veya odak anahtar kelime..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Araştırılıyor</span>
            </>
          ) : (
            <span>Google’da Ara</span>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
            {result.summaryMarkdown}
          </div>

          {onInsertSnippet && result.summaryMarkdown && (
            <button
              type="button"
              onClick={() => onInsertSnippet(result.summaryMarkdown)}
              className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            >
              Araştırma Notlarını Editöre Ekle
            </button>
          )}

          {result.sources.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Doğrulanmış Web Kaynakları ({result.sources.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.sources.map((src) => (
                  <li key={src.uri}>
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-md">{src.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
