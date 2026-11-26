import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  FolderPlus,
  ImagePlus,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import { BlogPost, Category, MediaAsset, TagItem } from '../types/admin';
import { slugifyTurkish } from '../utils/seoAudit';
import { SafeImage } from './SafeImage';

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
          {categories.map((cat) => {
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
                    disabled={categories.length <= 1}
                    title="Kategoriyi sil"
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
            placeholder="Yeni etiket adı (Örn: Yapay Zeka)"
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
          {tags.map((tag) => {
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
          })}
        </div>
      </section>
    </div>
  );
};

interface MediaLibraryViewProps {
  mediaAssets: MediaAsset[];
  currentUserName: string;
  onAddMedia: (asset: MediaAsset) => void;
  onUpdateAltText: (id: string, altText: string) => void;
  onDeleteMedia: (id: string) => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  mediaAssets,
  currentUserName,
  onAddMedia,
  onUpdateAltText,
  onDeleteMedia,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(mediaAssets[0]?.id ?? '');

  const selectedAsset = mediaAssets.find((m) => m.id === selectedAssetId) ?? mediaAssets[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const newAsset: MediaAsset = {
        id: `med-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        url: result,
        altText: file.name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
        mimeType: file.type || 'image/jpeg',
        sizeKb: Math.max(12, Math.round(file.size / 1024)),
        dimensions: 'Özel Yükleme',
        uploadedAt: '2026-11-26',
        uploadedBy: currentUserName,
      };
      onAddMedia(newAsset);
      setSelectedAssetId(newAsset.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard?.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Görsel ve Medya Arşivi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toplam {mediaAssets.length} varlık · Alt metinleri SEO standartlarına göre düzenleyin.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              <ImagePlus className="h-4 w-4" />
              <span>Yeni Görsel Yükle</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {mediaAssets.map((asset) => {
            const isSelected = selectedAsset?.id === asset.id;
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
                <SafeImage
                  src={asset.url}
                  alt={asset.altText}
                  fallbackLabel={asset.title}
                  className="h-36 w-full object-cover"
                />
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
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        {selectedAsset ? (
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Varlık Ayrıntıları
            </h3>
            <SafeImage
              src={selectedAsset.url}
              alt={selectedAsset.altText}
              fallbackLabel={selectedAsset.title}
              className="h-44 w-full rounded-lg object-cover"
            />
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
                Erişilebilirlik ve SEO Alt Metni
              </label>
              <textarea
                rows={3}
                value={selectedAsset.altText}
                onChange={(e) => onUpdateAltText(selectedAsset.id, e.target.value)}
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
                disabled={mediaAssets.length <= 1}
                aria-label="Görseli sil"
                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Detayları görmek için bir görsel seçin.</p>
        )}
      </aside>
    </div>
  );
};
