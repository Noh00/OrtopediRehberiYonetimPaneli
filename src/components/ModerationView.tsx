import React, { useMemo, useState } from 'react';
import {
  Ban,
  Check,
  MessageSquareReply,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  BlogPost,
  ModerationComment,
  ModerationStatus,
  SpamFilterConfig,
} from '../types/admin';

interface ModerationViewProps {
  comments: ModerationComment[];
  posts: BlogPost[];
  spamConfig: SpamFilterConfig;
  canResolve: boolean;
  onUpdateCommentStatus: (id: string, status: ModerationStatus) => void;
  onReplyComment: (id: string, reply: string) => void;
  onToggleBlockAuthor: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onUpdateSpamConfig: (cfg: SpamFilterConfig) => void;
}

const STATUS_TABS: { id: ModerationStatus | 'all'; label: string }[] = [
  { id: 'pending', label: 'Beklemede' },
  { id: 'approved', label: 'Onaylandı' },
  { id: 'spam', label: 'Spam' },
  { id: 'rejected', label: 'Reddedildi' },
  { id: 'all', label: 'Tümü' },
];

const STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: 'Onay Bekliyor',
  approved: 'Onaylandı',
  spam: 'Spam İşaretli',
  rejected: 'Reddedildi',
};

export const ModerationView: React.FC<ModerationViewProps> = ({
  comments,
  posts,
  spamConfig,
  canResolve,
  onUpdateCommentStatus,
  onReplyComment,
  onToggleBlockAuthor,
  onDeleteComment,
  onUpdateSpamConfig,
}) => {
  const [statusTab, setStatusTab] = useState<ModerationStatus | 'all'>('pending');
  const [query, setQuery] = useState('');
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newBlockedWord, setNewBlockedWord] = useState('');

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (statusTab !== 'all' && c.status !== statusTab) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          c.authorName.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.authorEmail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [comments, statusTab, query]);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const w = newBlockedWord.trim().toLowerCase();
    if (!w || spamConfig.blockedWords.includes(w)) return;
    onUpdateSpamConfig({
      ...spamConfig,
      blockedWords: [...spamConfig.blockedWords, w],
    });
    setNewBlockedWord('');
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Main Moderation Queue */}
      <div className="space-y-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? comments.length
                  : comments.filter((c) => c.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    statusTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Yorum veya yazar ara..."
              className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Şu anda Herhangi bir veri bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Diğer durum sekmelerinden moderasyon geçmişini görüntüleyebilirsiniz.
              </p>
            </div>
          ) : (
            filtered.map((comment) => {
              const targetPost = posts.find((p) => p.id === comment.postId);
              return (
                <article
                  key={comment.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {comment.authorEmail}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          IP: {comment.authorIp}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Yazı:{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {targetPost?.title ?? 'Silinmiş Yazı'}
                        </span>{' '}
                        · <span className="tabular-nums">{comment.createdAt}</span>
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        comment.status === 'approved'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : comment.status === 'pending'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {STATUS_LABELS[comment.status]}
                      {comment.isBlockedUser ? ' · Engelli Yazar' : ''}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {comment.content}
                  </p>

                  {comment.reportReason && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>
                        {comment.reportReason}
                        {comment.flaggedWords.length > 0 &&
                          ` (${comment.flaggedWords.join(', ')})`}
                      </span>
                    </div>
                  )}

                  {comment.moderatorReply && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                      <strong className="font-semibold">Moderatör Yanıtı:</strong>{' '}
                      {comment.moderatorReply}
                    </div>
                  )}

                  {replyOpenId === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Okura gösterilecek moderatör yanıtını yazın..."
                        className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!replyText.trim()) return;
                          onReplyComment(comment.id, replyText.trim());
                          setReplyText('');
                          setReplyOpenId(null);
                        }}
                        className="rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Yanıtı Kaydet
                      </button>
                    </div>
                  )}

                  {canResolve && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {comment.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => onUpdateCommentStatus(comment.id, 'approved')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Onayla</span>
                        </button>
                      )}
                      {comment.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onUpdateCommentStatus(comment.id, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reddet</span>
                        </button>
                      )}
                      {comment.status !== 'spam' && (
                        <button
                          type="button"
                          onClick={() => onUpdateCommentStatus(comment.id, 'spam')}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Spam İşaretle</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyOpenId(replyOpenId === comment.id ? null : comment.id);
                          setReplyText(comment.moderatorReply ?? '');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <MessageSquareReply className="h-3.5 w-3.5" />
                        <span>Yanıtla</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleBlockAuthor(comment.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>{comment.isBlockedUser ? 'Engeli Kaldır' : 'Yazarı Engelle'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteComment(comment.id)}
                        aria-label="Yorumu sil"
                        className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Spam & Auto-Moderation Rules */}
      <aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Otomatik Moderasyon Kuralları
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Şüpheli bağlantıları ve yasaklı ifadeleri yayından önce yakalayın.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>İlk kez yorum yapanları onaya düşür</span>
            <input
              type="checkbox"
              disabled={!canResolve}
              checked={spamConfig.autoHoldFirstTimeAuthors}
              onChange={(e) =>
                onUpdateSpamConfig({
                  ...spamConfig,
                  autoHoldFirstTimeAuthors: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>Ardışık IP hız sınırı (Rate limit)</span>
            <input
              type="checkbox"
              disabled={!canResolve}
              checked={spamConfig.enableRateLimiting}
              onChange={(e) =>
                onUpdateSpamConfig({
                  ...spamConfig,
                  enableRateLimiting: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              İncelemeye düşecek maksimum dış bağlantı sayısı
            </label>
            <input
              type="number"
              min={0}
              max={10}
              disabled={!canResolve}
              value={spamConfig.maxLinksBeforeHold}
              onChange={(e) =>
                onUpdateSpamConfig({
                  ...spamConfig,
                  maxLinksBeforeHold: Number(e.target.value),
                })
              }
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
            Yasaklı Kelime ve Alan Adı Filtresi
          </h3>
          {canResolve && (
            <form onSubmit={handleAddWord} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newBlockedWord}
                onChange={(e) => setNewBlockedWord(e.target.value)}
                placeholder="İfade veya domain..."
                className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ekle</span>
              </button>
            </form>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {spamConfig.blockedWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <span>{word}</span>
                {canResolve && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSpamConfig({
                        ...spamConfig,
                        blockedWords: spamConfig.blockedWords.filter((w) => w !== word),
                      })
                    }
                    aria-label={`${word} kelimesini kaldır`}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
