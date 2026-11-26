import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  Film,
  Folder,
  FolderPlus,
  ImagePlus,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react';
import {
  BlogPost,
  Category,
  MediaAsset,
  MediaFolder,
  TagItem,
} from '../types/admin';
import { slugifyTurkish } from '../utils/seoAudit';
import { SafeImage } from './SafeImage';

const FOLDER_COLOR_PRESETS = [
  '#2563EB',
  '#0D9488',
  '#4F46E5',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#059669',
  '#475569',
];

function isVideoAsset(asset: MediaAsset): boolean {
  return (
    asset.mimeType.startsWith('video/') ||
    asset.url.startsWith('data:video/') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(asset.url)
  );
}

interface TaxonomyViewProps {
  categories: Category[];
  tags: TagItem[];
  posts: BlogPost[];
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddTag: (tag: TagItem) => void;
  onDeleteTag: (id: string) => void;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({
  categories,
  tags,
  posts,
  onAddCategory,
  onDeleteCategory,
  onAddTag,
  onDeleteTag,
}) => {
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('#2563EB');
  const [tagName, setTagName] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCategory({
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      slug: slugifyTurkish(catName),
      description: catDesc.trim() || 'Editoryal içerik kategorisi.',
      color: catColor,
    });
    setCatName('');
    setCatDesc('');
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    onAddTag({
      id: `tag-${Date.now()}`,
      name: tagName.trim(),
      slug: slugifyTurkish(tagName),
    });
    setTagName('');
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Categories */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Blog Kategorileri
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Yayın mimarisini düzenleyin; her kategori otomatik SEO slug’ı ile oluşturulur.
          </p>
        </div>

        <form onSubmit={handleCreateCategory} className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Yeni kategori adı"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:col-span-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                aria-label="Kategori rengi"
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>
          <input
            type="text"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
            placeholder="Kategori açıklaması (arşiv sayfaları meta açıklaması için kullanılır)"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </form>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categories.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </p>
          ) : (
            categories.map((cat) => {
              const count = posts.filter((p) => p.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <span className="font-mono text-[11px] text-slate-400">/{cat.slug}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {cat.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                      {count} yazı
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat.id)}
                      title="Kategoriyi sil"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Tags */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Konu Etiketleri
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            İçerik kümelerini birbirine bağlamak için kullanılan konu etiketleri.
          </p>
        </div>

        <form onSubmit={handleCreateTag} className="flex gap-2">
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Yeni etiket adı (Örn: Ortopedi)"
            className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            <TagIcon className="h-3.5 w-3.5" />
            <span>Etiket Oluştur</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tags.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Şu anda Herhangi bir veri bulunamadı
            </p>
          ) : (
            tags.map((tag) => {
              const count = posts.filter((p) => p.tags.includes(tag.name)).length;
              return (
                <div key={tag.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {tag.name}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-slate-400">/{tag.slug}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {count} kullanım
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteTag(tag.id)}
                      aria-label={`${tag.name} etiketini sil`}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

interface MediaLibraryViewProps {
  mediaAssets: MediaAsset[];
  mediaFolders: MediaFolder[];
  currentUserName: string;
  onAddMedia: (asset: MediaAsset) => Promise<void> | void;
  onUpdateMedia: (asset: MediaAsset) => Promise<void> | void;
  onDeleteMedia: (id: string) => void;
  onSaveFolder: (folder: MediaFolder) => Promise<void> | void;
  onDeleteFolder: (id: string) => Promise<void> | void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  mediaAssets,
  mediaFolders,
  currentUserName,
  onAddMedia,
  onUpdateMedia,
  onDeleteMedia,
  onSaveFolder,
  onDeleteFolder,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string>('all'); // 'all' | 'unassigned' | folder.id
  const [selectedAssetId, setSelectedAssetId] = useState<string>(mediaAssets[0]?.id ?? '');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Simple folder create/edit panel state
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#2563EB');

  const visibleAssets = useMemo(() => {
    if (activeFolderId === 'all') return mediaAssets;
    if (activeFolderId === 'unassigned') return mediaAssets.filter((m) => !m.folderId);
    return mediaAssets.filter((m) => m.folderId === activeFolderId);
  }, [mediaAssets, activeFolderId]);

  const selectedAsset =
    visibleAssets.find((m) => m.id === selectedAssetId) ??
    visibleAssets[0] ??
    null;

  const openNewFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('#2563EB');
    setFolderFormOpen(true);
  };

  const openEditFolder = (folder: MediaFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderFormOpen(true);
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    const payload: MediaFolder = editingFolder
      ? { ...editingFolder, name: folderName.trim(), color: folderColor }
      : {
          id: `fld-${Date.now()}`,
          name: folderName.trim(),
          color: folderColor,
          createdAt: new Date().toISOString().slice(0, 10),
        };
    await onSaveFolder(payload);
    setActiveFolderId(payload.id);
    setFolderFormOpen(false);
    setEditingFolder(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError(null);

    const targetFolderId =
      activeFolderId !== 'all' && activeFolderId !== 'unassigned'
        ? activeFolderId
        : undefined;

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        setUploadError(`"${file.name}" dosyası 15 MB sınırını aşıyor.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) return;
        const isVideo = file.type.startsWith('video/');
        const newAsset: MediaAsset = {
          id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: file.name.replace(/\.[^.]+$/, ''),
          url: result,
          altText: file.name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          dimensions: isVideo ? 'Video Dosyası' : 'Görsel Dosyası',
          uploadedAt: new Date().toISOString().slice(0, 10),
          uploadedBy: currentUserName,
          folderId: targetFolderId,
        };
        await onAddMedia(newAsset);
        setSelectedAssetId(newAsset.id);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard?.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Simple Folder Strip & Upload Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Görsel ve Video Klasörleri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klasör oluşturun, rengini ve adını düzenleyin, içine istediğiniz görsel veya videoları yükleyin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openNewFolder}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Yeni Klasör</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <ImagePlus className="h-4 w-4" />
              <span>Görsel / Video Yükle</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {uploadError}
          </p>
        )}

        {/* Inline Simple Create/Edit Folder Form */}
        {folderFormOpen && (
          <form
            onSubmit={handleFolderSubmit}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <div className="min-w-[200px] flex-1">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {editingFolder ? 'Klasör Adını Değiştir' : 'Yeni Klasör Adı'}
              </label>
              <input
                type="text"
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Örn: Ortopedi Videoları"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Klasör Rengi
              </label>
              <div className="mt-1 flex items-center gap-1.5">
                {FOLDER_COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFolderColor(c)}
                    aria-label={`Renk ${c}`}
                    className={`h-6 w-6 rounded-md border-2 transition-transform ${
                      folderColor === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                  aria-label="Özel klasör rengi seç"
                  className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="h-9 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                {editingFolder ? 'Güncelle' : 'Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFolderFormOpen(false);
                  setEditingFolder(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Folder Cards Strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFolderId('all')}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              activeFolderId === 'all'
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Tüm Dosyalar ({mediaAssets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolderId('unassigned')}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              activeFolderId === 'unassigned'
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <span>Klasörsüz ({mediaAssets.filter((m) => !m.folderId).length})</span>
          </button>

          {mediaFolders.map((folder) => {
            const count = mediaAssets.filter((m) => m.folderId === folder.id).length;
            const active = activeFolderId === folder.id;
            return (
              <div
                key={folder.id}
                className={`inline-flex items-center gap-1 rounded-lg border pr-1 transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color, fill: folder.color }} />
                  <span>{folder.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">({count})</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditFolder(folder)}
                  title="Klasörü düzenle"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteFolder(folder.id);
                    if (activeFolderId === folder.id) setActiveFolderId('all');
                  }}
                  title="Klasörü sil"
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Media Grid & Detail Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {visibleAssets.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Şu anda Herhangi bir veri bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Bu klasöre görsel veya video yüklemek için yukarıdaki "Görsel / Video Yükle" butonunu kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {visibleAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const folder = mediaFolders.find((f) => f.id === asset.folderId);
                const video = isVideoAsset(asset);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`cursor-pointer overflow-hidden rounded-xl border bg-white transition-all dark:bg-slate-900 ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
                      {video ? (
                        <video
                          src={asset.url}
                          muted
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <SafeImage
                          src={asset.url}
                          alt={asset.altText}
                          fallbackLabel={asset.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {video && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          <Film className="h-3 w-3" />
                          Video
                        </span>
                      )}
                      {folder && (
                        <span
                          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-800 shadow-xs dark:bg-slate-900/90 dark:text-slate-100"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          {folder.name}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {asset.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400 tabular-nums">
                        {asset.dimensions} · {asset.sizeKb} KB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {selectedAsset ? (
            <div className="space-y-4">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Varlık Ayrıntıları
              </h3>
              {isVideoAsset(selectedAsset) ? (
                <video
                  src={selectedAsset.url}
                  controls
                  className="h-44 w-full rounded-lg bg-black object-contain"
                />
              ) : (
                <SafeImage
                  src={selectedAsset.url}
                  alt={selectedAsset.altText}
                  fallbackLabel={selectedAsset.title}
                  className="h-44 w-full rounded-lg object-cover"
                />
              )}
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-900 dark:text-white">{selectedAsset.title}</p>
                <p className="font-mono tabular-nums">
                  {selectedAsset.mimeType} · {selectedAsset.sizeKb} KB · {selectedAsset.dimensions}
                </p>
                <p>
                  Yükleyen: {selectedAsset.uploadedBy} · {selectedAsset.uploadedAt}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bulunduğu Klasör
                </label>
                <select
                  value={selectedAsset.folderId || ''}
                  onChange={(e) =>
                    onUpdateMedia({
                      ...selectedAsset,
                      folderId: e.target.value || undefined,
                    })
                  }
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Klasörsüz (Genel Arşiv)</option>
                  {mediaFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Erişilebilirlik ve SEO Alt Metni
                </label>
                <textarea
                  rows={3}
                  value={selectedAsset.altText}
                  onChange={(e) =>
                    onUpdateMedia({
                      ...selectedAsset,
                      altText: e.target.value,
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedAsset)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copiedId === selectedAsset.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>URL Kopyala</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteMedia(selectedAsset.id)}
                  aria-label="Medyayı sil"
                  className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Şu anda Herhangi bir veri bulunamadı</p>
          )}
        </aside>
      </div>
    </div>
  );
};

