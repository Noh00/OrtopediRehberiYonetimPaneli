import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Newspaper,
  Palette,
  Plus,
  Save,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BRAND_CONCEPT_PRESETS,
} from '../data/initialData';
import type {
  BrandConceptKey,
  DoctorProfile,
  DoctorStatus,
  MediaAsset,
  MedicalNewsItem,
  PermissionKey,
  RoleDefinition,
  SiteBrandConfig,
  SiteSeoConfig,
  TeamUser,
} from '../types/admin';
import { SafeImage } from './SafeImage';

type StudioTab = 'brand' | 'roles' | 'doctors' | 'news';

interface SiteStudioViewProps {
  siteBrand: SiteBrandConfig;
  siteSeo: SiteSeoConfig;
  mediaAssets: MediaAsset[];
  roles: RoleDefinition[];
  users: TeamUser[];
  doctors: DoctorProfile[];
  news: MedicalNewsItem[];
  canManageBrand: boolean;
  canManageRoles: boolean;
  canManageDoctors: boolean;
  currentUserName: string;
  onSaveSiteBrand: (brand: SiteBrandConfig, alsoSyncSeoName?: boolean) => Promise<boolean> | boolean;
  onAddMedia: (asset: MediaAsset) => Promise<void> | void;
  onSaveRole: (role: RoleDefinition) => Promise<boolean> | boolean;
  onDeleteRole: (roleKey: string) => Promise<boolean> | boolean;
  onSaveDoctor: (doctor: DoctorProfile, isNew: boolean) => Promise<boolean> | boolean;
  onDeleteDoctor: (id: string) => Promise<boolean> | boolean;
  onSaveNews: (item: MedicalNewsItem, isNew: boolean) => Promise<boolean> | boolean;
  onDeleteNews: (id: string) => Promise<boolean> | boolean;
}

const PERMISSION_OPTIONS: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'posts_publish', label: 'Yazı Yayınlama', desc: 'Taslakları doğrudan yayına alır' },
  { key: 'posts_delete', label: 'Yazı Silme', desc: 'Yayınları kalıcı olarak siler' },
  { key: 'seo_manage', label: 'SEO ve Marka Ayarları', desc: 'SEO, logo, banner ve yönlendirmeler' },
  { key: 'analytics_export', label: 'Rapor Dışa Aktarma', desc: 'CSV ve JSON istatistik indirir' },
  { key: 'moderation_resolve', label: 'Yorum Moderasyonu', desc: 'Yorumları onaylar veya spam işaretler' },
  { key: 'calendar_manage', label: 'Takvim ve Görevler', desc: 'Ekip görevlerini ve yayın tarihlerini planlar' },
  { key: 'media_manage', label: 'Medya Kütüphanesi', desc: 'Görsel yükler ve alt metin düzenler' },
  { key: 'users_manage', label: 'Kullanıcı, Rol & Doktor Yönetimi', desc: 'Ekip, özel roller ve doktor profilleri' },
];

const EMPTY_PERMS: Record<PermissionKey, boolean> = {
  posts_publish: false,
  posts_delete: false,
  seo_manage: false,
  analytics_export: false,
  users_manage: false,
  moderation_resolve: false,
  calendar_manage: false,
  media_manage: false,
};

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  active: 'Aktif Görevde',
  on_leave: 'İzinli / Geçici Kapalı',
  archived: 'Arşivlendi',
};

export const SiteStudioView: React.FC<SiteStudioViewProps> = ({
  siteBrand,
  siteSeo,
  mediaAssets,
  roles,
  users,
  doctors,
  news,
  canManageBrand,
  canManageRoles,
  canManageDoctors,
  currentUserName,
  onSaveSiteBrand,
  onAddMedia,
  onSaveRole,
  onDeleteRole,
  onSaveDoctor,
  onDeleteDoctor,
  onSaveNews,
  onDeleteNews,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('brand');

  // --- Tab 1: Brand & Visuals state ---
  const [brandDraft, setBrandDraft] = useState<SiteBrandConfig>(siteBrand);
  const [syncSeoName, setSyncSeoName] = useState(true);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandSavedMsg, setBrandSavedMsg] = useState('');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    null | 'logoLightUrl' | 'logoDarkUrl' | 'faviconUrl' | 'heroBannerUrl' | 'secondaryBannerUrl' | 'doctorAvatar' | 'newsImage'
  >(null);

  // Sync draft when server prop refreshes externally
  React.useEffect(() => {
    setBrandDraft(siteBrand);
  }, [siteBrand]);

  // --- Tab 2: Role Definition state ---
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleKeyInput, setRoleKeyInput] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [rolePerms, setRolePerms] = useState<Record<PermissionKey, boolean>>({
    ...EMPTY_PERMS,
    calendar_manage: true,
    media_manage: true,
  });
  const [roleSaving, setRoleSaving] = useState(false);

  // --- Tab 3: Doctors Management state ---
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState<DoctorStatus | 'all'>('all');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [docForm, setDocForm] = useState<DoctorProfile>({
    id: '',
    fullName: '',
    title: '',
    specialty: '',
    licenseNo: '',
    department: '',
    bio: '',
    avatarUrl: '',
    email: '',
    phone: '',
    location: '',
    languages: ['Türkçe'],
    availableDays: 'Pazartesi - Cuma · 09:00 - 17:00',
    featured: true,
    status: 'active',
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  const [docLanguagesInput, setDocLanguagesInput] = useState('Türkçe');
  const [docSaving, setDocSaving] = useState(false);

  // --- Tab 4: News Management state ---
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<MedicalNewsItem | null>(null);
  const [newsForm, setNewsForm] = useState<MedicalNewsItem>({
    id: '',
    title: '',
    summary: '',
    source: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    categoryLabel: 'Güncel Duyuru',
    imageUrl: '',
    doctorName: '',
  });
  const [newsSaving, setNewsSaving] = useState(false);

  const filteredDoctors = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return doctors.filter((d) => {
      if (docStatusFilter !== 'all' && d.status !== docStatusFilter) return false;
      if (!q) return true;
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q)
      );
    });
  }, [doctors, docSearch, docStatusFilter]);

  const handleApplyPreset = (conceptKey: BrandConceptKey) => {
    const preset = BRAND_CONCEPT_PRESETS[conceptKey];
    setBrandDraft((prev) => ({
      ...preset,
      logoLightUrl: prev.logoLightUrl,
      logoDarkUrl: prev.logoDarkUrl,
      faviconUrl: prev.faviconUrl,
    }));
  };

  const handleLocalFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'logoLightUrl' | 'logoDarkUrl' | 'faviconUrl' | 'heroBannerUrl' | 'secondaryBannerUrl' | 'doctorAvatar' | 'newsImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setBrandSavedMsg('Görsel boyutu en fazla 2 MB olabilir.');
      setTimeout(() => setBrandSavedMsg(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;

      const assetTitle = file.name.replace(/\.[^.]+$/, '');
      const newAsset: MediaAsset = {
        id: `med-${Date.now()}`,
        title: assetTitle,
        url: dataUrl,
        altText: assetTitle,
        mimeType: file.type || 'image/png',
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        dimensions: 'Yüklenen Görsel',
        uploadedAt: new Date().toISOString().slice(0, 10),
        uploadedBy: currentUserName,
      };
      await onAddMedia(newAsset);

      if (target === 'doctorAvatar') {
        setDocForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      } else if (target === 'newsImage') {
        setNewsForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      } else {
        setBrandDraft((prev) => ({ ...prev, [target]: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBrand) return;
    setBrandSaving(true);
    try {
      const ok = await onSaveSiteBrand(brandDraft, syncSeoName);
      if (ok) {
        setBrandSavedMsg('Marka kimliği, logo ve bannerlar kaydedildi.');
        setTimeout(() => setBrandSavedMsg(''), 3000);
      }
    } finally {
      setBrandSaving(false);
    }
  };

  const startNewRole = () => {
    setEditingRoleKey(null);
    setRoleName('');
    setRoleKeyInput('');
    setRoleDesc('');
    setRolePerms({ ...EMPTY_PERMS, calendar_manage: true, media_manage: true });
  };

  const startEditRole = (role: RoleDefinition) => {
    setEditingRoleKey(role.key);
    setRoleName(role.name);
    setRoleKeyInput(role.key);
    setRoleDesc(role.description);
    setRolePerms({ ...role.permissions });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoles) return;
    const cleanName = roleName.trim();
    const key = editingRoleKey || slugifyKey(roleKeyInput.trim() || cleanName);
    if (!cleanName || !key) return;

    const existing = roles.find((r) => r.key === key);
    setRoleSaving(true);
    try {
      const ok = await onSaveRole({
        key,
        name: cleanName,
        description: roleDesc.trim() || `${cleanName} özel rol yetkileri`,
        isSystem: existing?.isSystem ?? false,
        permissions: rolePerms,
        createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
      });
      if (ok && !editingRoleKey) {
        startNewRole();
      }
    } finally {
      setRoleSaving(false);
    }
  };

  const openNewDoctorModal = () => {
    setEditingDoctor(null);
    setDocForm({
      id: `doc-${Date.now()}`,
      fullName: '',
      title: '',
      specialty: '',
      licenseNo: '',
      department: brandDraft.conceptKey === 'pharma' ? 'Medikal Direktörlük' : 'Ortopedi Kliniği',
      bio: '',
      avatarUrl: mediaAssets.find((m) => m.title.toLowerCase().includes('avatar'))?.url || '',
      email: '',
      phone: '',
      location: 'Merkez Klinik',
      languages: ['Türkçe'],
      availableDays: 'Pazartesi - Cuma · 09:00 - 17:00',
      featured: true,
      status: 'active',
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setDocLanguagesInput('Türkçe, İngilizce');
    setDocModalOpen(true);
  };

  const openEditDoctorModal = (doctor: DoctorProfile) => {
    setEditingDoctor(doctor);
    setDocForm({ ...doctor });
    setDocLanguagesInput(doctor.languages.join(', '));
    setDocModalOpen(true);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageDoctors) return;
    if (!docForm.fullName.trim() || !docForm.specialty.trim()) return;

    const langs = docLanguagesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: DoctorProfile = {
      ...docForm,
      fullName: docForm.fullName.trim(),
      title: docForm.title.trim() || 'Uzman Hekim',
      specialty: docForm.specialty.trim(),
      languages: langs.length > 0 ? langs : ['Türkçe'],
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setDocSaving(true);
    try {
      const ok = await onSaveDoctor(payload, !editingDoctor);
      if (ok) {
        setDocModalOpen(false);
        setEditingDoctor(null);
      }
    } finally {
      setDocSaving(false);
    }
  };

  const openNewNewsModal = () => {
    setEditingNews(null);
    setNewsForm({
      id: `news-${Date.now()}`,
      title: '',
      summary: '',
      source: brandDraft.brandName || 'Editoryal Bülten',
      publishedAt: new Date().toISOString().slice(0, 10),
      categoryLabel: 'Güncel Haber',
      imageUrl: '',
      doctorName: doctors.find((d) => d.status === 'active')?.fullName || currentUserName,
    });
    setNewsModalOpen(true);
  };

  const openEditNewsModal = (item: MedicalNewsItem) => {
    setEditingNews(item);
    setNewsForm({ ...item });
    setNewsModalOpen(true);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBrand && !canManageDoctors) return;
    if (!newsForm.title.trim()) return;

    setNewsSaving(true);
    try {
      const ok = await onSaveNews(
        {
          ...newsForm,
          title: newsForm.title.trim(),
          summary: newsForm.summary.trim(),
          source: newsForm.source.trim() || brandDraft.brandName,
          categoryLabel: newsForm.categoryLabel.trim() || 'Haber',
          doctorName: newsForm.doctorName.trim() || currentUserName,
          publishedAt: newsForm.publishedAt || new Date().toISOString().slice(0, 10),
        },
        !editingNews
      );
      if (ok) {
        setNewsModalOpen(false);
        setEditingNews(null);
      }
    } finally {
      setNewsSaving(false);
    }
  };

  const renderImageField = (
    label: string,
    hint: string,
    fieldKey: 'logoLightUrl' | 'logoDarkUrl' | 'faviconUrl' | 'heroBannerUrl' | 'secondaryBannerUrl',
    value: string,
    previewClassName: string
  ) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        {value && (
          <button
            type="button"
            disabled={!canManageBrand}
            onClick={() => setBrandDraft((prev) => ({ ...prev, [fieldKey]: '' }))}
            className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
          >
            Kaldır
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${previewClassName}`}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-300 dark:text-slate-600" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="text"
            disabled={!canManageBrand}
            value={value}
            onChange={(e) =>
              setBrandDraft((prev) => ({ ...prev, [fieldKey]: e.target.value }))
            }
            placeholder="https://... veya /src/assets/..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-800 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {canManageBrand && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaPickerTarget(fieldKey)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Medya Kütüphanesinden Seç</span>
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Upload className="h-3.5 w-3.5" />
                <span>Dosya Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLocalFileUpload(e, fieldKey)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Module Header & Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'brand'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Görsel İçerik, Logo ve Tema Konsepti</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Yeni Rol Tanımlama ({roles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Doktor Yönetimi ({doctors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'news'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Newspaper className="h-3.5 w-3.5" />
            <span>Haberler ({news.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Aktif Konsept:{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {brandDraft.brandName}
            </strong>
          </span>
          {brandSavedMsg && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {brandSavedMsg}
            </span>
          )}
        </div>
      </div>

      {/* TAB 1: SITE BRAND, CONCEPTS, LOGOS & BANNERS */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <form onSubmit={handleSaveBrand} className="space-y-6 xl:col-span-3">
            {/* Quick Concept Switcher */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Site Teması ve Konsept Geçişi
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Sitenin sektör ve yayın konseptini tek tıkla değiştirin; ardından isim, logo ve bannerları dilediğiniz gibi özelleştirin.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0 text-blue-600" />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(BRAND_CONCEPT_PRESETS) as BrandConceptKey[]).map((key) => {
                  const preset = BRAND_CONCEPT_PRESETS[key];
                  const selected = brandDraft.conceptKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!canManageBrand}
                      onClick={() => handleApplyPreset(key)}
                      className={`flex flex-col rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                        selected
                          ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {preset.conceptLabel}
                        </span>
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {preset.brandName}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Brand Name, Tagline & Colors */}
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Marka Adı, Slogan ve Renk Paleti
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Site / Firma Adı
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canManageBrand}
                    value={brandDraft.brandName}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({
                        ...prev,
                        brandName: e.target.value,
                        conceptLabel: prev.conceptKey === 'custom' ? e.target.value : prev.conceptLabel,
                      }))
                    }
                    placeholder="Örn: Ortopedi Rehberi veya Anadolu Farma"
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Alt Başlık / Slogan
                  </label>
                  <input
                    type="text"
                    disabled={!canManageBrand}
                    value={brandDraft.tagline}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ana Vurgu Rengi
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!canManageBrand}
                      value={brandDraft.primaryColor}
                      onChange={(e) =>
                        setBrandDraft((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      disabled={!canManageBrand}
                      value={brandDraft.primaryColor}
                      onChange={(e) =>
                        setBrandDraft((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    İkincil Kurumsal Renk
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!canManageBrand}
                      value={brandDraft.secondaryColor}
                      onChange={(e) =>
                        setBrandDraft((prev) => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      disabled={!canManageBrand}
                      value={brandDraft.secondaryColor}
                      onChange={(e) =>
                        setBrandDraft((prev) => ({ ...prev, secondaryColor: e.target.value }))
                      }
                      className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Logos & Banners */}
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Logolar, Favicon ve Banner Görselleri
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {renderImageField(
                  'Ana Logo (Açık Zemin)',
                  'Üst menü ve açık tema başlığında görüntülenen ana kurum logosu',
                  'logoLightUrl',
                  brandDraft.logoLightUrl,
                  'h-16 w-28 p-2'
                )}
                {renderImageField(
                  'Koyu Tema Logosu',
                  'Koyu arka planlı üst menü veya alt bilgi alanında kullanılacak logo',
                  'logoDarkUrl',
                  brandDraft.logoDarkUrl,
                  'h-16 w-28 bg-slate-950 p-2'
                )}
                {renderImageField(
                  'Site Favicon / Simge',
                  'Tarayıcı sekmesi simgesi (kare oranlı PNG veya SVG önerilir)',
                  'faviconUrl',
                  brandDraft.faviconUrl,
                  'h-14 w-14 p-2'
                )}
                {renderImageField(
                  'Ana Hero Banner Görseli',
                  'Ana sayfa üst karşılama alanında gösterilen geniş manşet bannerı',
                  'heroBannerUrl',
                  brandDraft.heroBannerUrl,
                  'h-20 w-36'
                )}
                {renderImageField(
                  'İkincil Kurumsal / Kampanya Bannerı',
                  'Alt bölüm duyuruları veya ürün/klinik tanıtım bandı görseli',
                  'secondaryBannerUrl',
                  brandDraft.secondaryBannerUrl,
                  'h-20 w-36'
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Hero Banner Başlığı
                  </label>
                  <input
                    type="text"
                    disabled={!canManageBrand}
                    value={brandDraft.heroTitle}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({ ...prev, heroTitle: e.target.value }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Hero Banner Açıklaması
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canManageBrand}
                    value={brandDraft.heroSubtitle}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({ ...prev, heroSubtitle: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Banner CTA Buton Metni
                  </label>
                  <input
                    type="text"
                    disabled={!canManageBrand}
                    value={brandDraft.heroCtaLabel}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({ ...prev, heroCtaLabel: e.target.value }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Banner CTA Yönlendirme Yolu
                  </label>
                  <input
                    type="text"
                    disabled={!canManageBrand}
                    value={brandDraft.heroCtaUrl}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({ ...prev, heroCtaUrl: e.target.value }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    İkincil Banner Başlığı
                  </label>
                  <input
                    type="text"
                    disabled={!canManageBrand}
                    value={brandDraft.secondaryBannerTitle}
                    onChange={(e) =>
                      setBrandDraft((prev) => ({
                        ...prev,
                        secondaryBannerTitle: e.target.value,
                      }))
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {canManageBrand && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={syncSeoName}
                      onChange={(e) => setSyncSeoName(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>
                      SEO site başlık şablonunu ({siteSeo.siteName}) marka adıyla eşitle
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={brandSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{brandSaving ? 'Kaydediliyor...' : 'Marka ve Görselleri Kaydet'}</span>
                  </button>
                </div>
              )}
            </section>
          </form>

          {/* Live Site Showcase Preview */}
          <aside className="space-y-4 xl:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Canlı Site Görünüm Önizlemesi
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {brandDraft.conceptLabel}
                  </span>
                </div>

                {/* Simulated Site Navbar */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {brandDraft.logoLightUrl ? (
                      <img
                        src={brandDraft.logoLightUrl}
                        alt={brandDraft.brandName}
                        className="h-7 max-w-[120px] object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: brandDraft.primaryColor }}
                      >
                        {brandDraft.brandName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display text-xs font-bold text-slate-900 dark:text-white">
                        {brandDraft.brandName}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {brandDraft.tagline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Hero Banner */}
                <div className="relative h-56 overflow-hidden bg-slate-900">
                  {brandDraft.heroBannerUrl && (
                    <img
                      src={brandDraft.heroBannerUrl}
                      alt={brandDraft.heroTitle}
                      className="h-full w-full object-cover opacity-55"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(120deg, ${brandDraft.secondaryColor}E6 15%, ${brandDraft.secondaryColor}73 100%)`,
                    }}
                  />
                  <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white">
                    <p className="font-display text-base font-bold leading-snug">
                      {brandDraft.heroTitle}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-200">
                      {brandDraft.heroSubtitle}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: brandDraft.primaryColor }}
                      >
                        <span>{brandDraft.heroCtaLabel || 'Keşfet'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Banner Preview */}
                <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                    {brandDraft.secondaryBannerUrl ? (
                      <img
                        src={brandDraft.secondaryBannerUrl}
                        alt={brandDraft.secondaryBannerTitle}
                        className="h-12 w-20 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-slate-400">
                        İkincil Tanıtım Bannerı
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {brandDraft.secondaryBannerTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Featured Doctors Preview */}
                <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Vitrindeki Aktif Uzman Hekimler ({doctors.filter((d) => d.status === 'active').length})
                  </p>
                  <div className="mt-2 space-y-2">
                    {doctors.filter((d) => d.status === 'active').length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Şu anda Herhangi bir veri bulunamadı
                      </p>
                    ) : (
                      doctors
                        .filter((d) => d.status === 'active')
                        .slice(0, 2)
                        .map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2.5">
                            <SafeImage
                              src={doc.avatarUrl}
                              alt={doc.fullName}
                              fallbackLabel={doc.fullName}
                              isAvatar
                              className="h-8 w-8 rounded-md object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {doc.fullName}
                              </p>
                              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {doc.specialty}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: CUSTOM ROLE DEFINITION */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Role List */}
          <section className="space-y-3 xl:col-span-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Tanımlı Roller ({roles.length})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mevcut rolleri düzenleyin veya ekibinize yeni roller ekleyin.
                </p>
              </div>
              {canManageRoles && (
                <button
                  type="button"
                  onClick={startNewRole}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Yeni Rol</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {roles.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  Şu anda Herhangi bir veri bulunamadı
                </div>
              ) : (
                roles.map((r) => {
                const activePermsCount = Object.values(r.permissions).filter(Boolean).length;
                const assignedUsersCount = users.filter((u) => u.role === r.key).length;
                const isEditing = editingRoleKey === r.key;
                return (
                  <div
                    key={r.key}
                    className={`rounded-xl border bg-white p-4 transition-colors dark:bg-slate-900 ${
                      isEditing
                        ? 'border-blue-600 dark:border-blue-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                            {r.name}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400">
                            {r.key}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {r.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {canManageRoles && (
                          <button
                            type="button"
                            onClick={() => startEditRole(r)}
                            aria-label={`${r.name} rolünü düzenle`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canManageRoles && !r.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeleteRole(r.key)}
                            aria-label={`${r.name} rolünü sil`}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 tabular-nums dark:border-slate-800 dark:text-slate-400">
                      <span>{activePermsCount} / 8 Yetki</span>
                      <span>·</span>
                      <span>{assignedUsersCount} Ekip Üyesi</span>
                      <span>·</span>
                      <span className={r.isSystem ? 'text-slate-500' : 'font-medium text-blue-600 dark:text-blue-400'}>
                        {r.isSystem ? 'Sistem Rolü' : 'Özel Rol'}
                      </span>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </section>

          {/* Create / Edit Role Form */}
          <section className="xl:col-span-3">
            <form
              onSubmit={handleRoleSubmit}
              className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {editingRoleKey ? `Rolü Düzenle: ${roleName}` : 'Yeni Özel Rol Tanımla'}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Oluşturulan roller kullanıcı atama listesinde ve yetki matrisinde otomatik olarak etkinleşir.
                  </p>
                </div>
                {editingRoleKey && (
                  <button
                    type="button"
                    onClick={startNewRole}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Yeni Rol Oluşturmaya Geç
                  </button>
                )}
              </div>

              {!canManageRoles && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  Rol tanımlama veya düzenleme için Kullanıcı & Rol Yönetimi yetkisi gereklidir.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Rol Adı *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canManageRoles}
                    value={roleName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRoleName(val);
                      if (!editingRoleKey) {
                        setRoleKeyInput(slugifyKey(val));
                      }
                    }}
                    placeholder="Örn: Medikal Yayın Denetçisi"
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Sistem Rol Anahtarı
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canManageRoles || Boolean(editingRoleKey)}
                    value={roleKeyInput}
                    onChange={(e) => setRoleKeyInput(slugifyKey(e.target.value))}
                    placeholder="medikal_denetci"
                    className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Rol Sorumluluk Açıklaması
                </label>
                <textarea
                  rows={2}
                  disabled={!canManageRoles}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Bu role sahip ekip üyelerinin paneldeki sorumluluk alanı..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Modül İzinleri
                  </span>
                  {canManageRoles && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setRolePerms({
                            posts_publish: true,
                            posts_delete: true,
                            seo_manage: true,
                            analytics_export: true,
                            users_manage: true,
                            moderation_resolve: true,
                            calendar_manage: true,
                            media_manage: true,
                          })
                        }
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Tümünü Seç
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setRolePerms({ ...EMPTY_PERMS })}
                        className="font-medium text-slate-500 hover:underline dark:text-slate-400"
                      >
                        Temizle
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PERMISSION_OPTIONS.map((perm) => {
                    const checked = rolePerms[perm.key];
                    const isAdminLocked = editingRoleKey === 'admin' && perm.key === 'users_manage';
                    return (
                      <label
                        key={perm.key}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                          checked
                            ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
                            : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canManageRoles || isAdminLocked}
                          checked={checked}
                          onChange={() =>
                            setRolePerms((prev) => ({
                              ...prev,
                              [perm.key]: !prev[perm.key],
                            }))
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {perm.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {perm.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {canManageRoles && (
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {editingRoleKey && (
                    <button
                      type="button"
                      onClick={startNewRole}
                      className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      İptal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={roleSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>
                      {roleSaving
                        ? 'Kaydediliyor...'
                        : editingRoleKey
                          ? 'Rol Değişikliklerini Kaydet'
                          : 'Yeni Rolü Kaydet'}
                    </span>
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      )}

      {/* TAB 3: DOCTORS MANAGEMENT */}
      {activeTab === 'doctors' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Doktor adı, uzmanlık veya bölüm ara..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value as DoctorStatus | 'all')}
                aria-label="Doktor durum filtresi"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">Tüm Durumlar ({doctors.length})</option>
                <option value="active">Aktif Görevde</option>
                <option value="on_leave">İzinli / Geçici Kapalı</option>
                <option value="archived">Arşivlendi</option>
              </select>
            </div>

            {canManageDoctors && (
              <button
                type="button"
                onClick={openNewDoctorModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Doktor Tanımla</span>
              </button>
            )}
          </div>

          {/* Doctors Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <th className="px-5 py-3">Hekim / Uzman</th>
                    <th className="px-4 py-3">Uzmanlık & Bölüm</th>
                    <th className="px-4 py-3">Sicil & İletişim</th>
                    <th className="px-4 py-3">Çalışma Saatleri</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-xs text-slate-500">
                        Şu anda Herhangi bir veri bulunamadı
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <SafeImage
                              src={doc.avatarUrl}
                              alt={doc.fullName}
                              fallbackLabel={doc.fullName}
                              isAvatar
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {doc.fullName}
                                </p>
                                {doc.featured && (
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {doc.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                            {doc.specialty}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.department} · {doc.location}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                            {doc.licenseNo || '—'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.email || doc.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          <p>{doc.availableDays}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {doc.languages.join(', ')}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={`font-medium ${
                              doc.status === 'active'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : doc.status === 'on_leave'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-400'
                            }`}
                          >
                            {DOCTOR_STATUS_LABELS[doc.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {canManageDoctors && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSaveDoctor({ ...doc, featured: !doc.featured }, false)
                                  }
                                  title={doc.featured ? 'Vitrinden çıkar' : 'Vitrinde öne çıkar'}
                                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      doc.featured ? 'fill-amber-400 text-amber-500' : ''
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditDoctorModal(doc)}
                                  aria-label={`${doc.fullName} düzenle`}
                                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteDoctor(doc.id)}
                                  aria-label={`${doc.fullName} sil`}
                                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NEWS MANAGEMENT */}
      {activeTab === 'news' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Anasayfa Haber ve Duyuru Akışı ({news.length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Anasayfa üst kayan haber şeridi ve haber kartları yalnızca buradaki gerçek kayıtlardan beslenir.
              </p>
            </div>
            {(canManageBrand || canManageDoctors) && (
              <button
                type="button"
                onClick={openNewNewsModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Haber Ekle</span>
              </button>
            )}
          </div>

          {news.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
              <Newspaper className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                Şu anda Herhangi bir veri bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Anasayfada görüntülenecek gerçek bir haber veya duyuru ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.title}
                      fallbackLabel={item.categoryLabel || 'Haber'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {item.categoryLabel}
                      </span>
                      <span className="font-mono tabular-nums">{item.publishedAt}</span>
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.summary}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.source} · {item.doctorName}
                      </span>
                      {(canManageBrand || canManageDoctors) && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditNewsModal(item)}
                            aria-label={`${item.title} düzenle`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNews(item.id)}
                            aria-label={`${item.title} sil`}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Medya Kütüphanesinden Görsel Seç
              </h3>
              <button
                type="button"
                onClick={() => setMediaPickerTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {mediaAssets.filter((m) => !m.mimeType.startsWith('video/')).length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Şu anda Herhangi bir veri bulunamadı
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
                {mediaAssets
                  .filter((m) => !m.mimeType.startsWith('video/'))
                  .map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        if (mediaPickerTarget === 'doctorAvatar') {
                          setDocForm((prev) => ({ ...prev, avatarUrl: asset.url }));
                        } else if (mediaPickerTarget === 'newsImage') {
                          setNewsForm((prev) => ({ ...prev, imageUrl: asset.url }));
                        } else {
                          setBrandDraft((prev) => ({
                            ...prev,
                            [mediaPickerTarget]: asset.url,
                          }));
                        }
                        setMediaPickerTarget(null);
                      }}
                      className="group overflow-hidden rounded-xl border border-slate-200 text-left transition-colors hover:border-blue-600 dark:border-slate-800 dark:hover:border-blue-500"
                    >
                      <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={asset.url}
                          alt={asset.altText || asset.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                          {asset.title}
                        </p>
                        <p className="truncate font-mono text-[10px] text-slate-400">
                          {asset.dimensions}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctor Create / Edit Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {editingDoctor ? `Doktoru Düzenle: ${editingDoctor.fullName}` : 'Yeni Doktor Tanımla'}
              </h3>
              <button
                type="button"
                onClick={() => setDocModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="space-y-4 overflow-y-auto p-6">
              {/* Avatar Row */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/30">
                <SafeImage
                  src={docForm.avatarUrl}
                  alt={docForm.fullName || 'Doktor'}
                  fallbackLabel={docForm.fullName || 'DR'}
                  isAvatar
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={docForm.avatarUrl}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, avatarUrl: e.target.value }))
                    }
                    placeholder="Profil fotoğrafı URL adresi..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('doctorAvatar')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Kütüphaneden Seç</span>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Fotoğraf Yükle</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFileUpload(e, 'doctorAvatar')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Unvan ve Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.fullName}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="Örn: Prof. Dr. Ahmet Demirtaş"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Klinik Unvanı *
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Örn: Ortopedi ve Travmatoloji Uzmanı"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Uzmanlık Alanı *
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.specialty}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, specialty: e.target.value }))
                    }
                    placeholder="Örn: Diz ve Kalça Eklem Cerrahisi"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Bölüm / Poliklinik
                  </label>
                  <input
                    type="text"
                    value={docForm.department}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Diploma / Sicil No
                  </label>
                  <input
                    type="text"
                    value={docForm.licenseNo}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, licenseNo: e.target.value }))
                    }
                    placeholder="TR-ORT-..."
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Çalışma Durumu
                  </label>
                  <select
                    value={docForm.status}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        status: e.target.value as DoctorStatus,
                      }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="active">Aktif Görevde</option>
                    <option value="on_leave">İzinli / Geçici Kapalı</option>
                    <option value="archived">Arşivlendi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={docForm.email}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={docForm.phone}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Konum / Şube
                  </label>
                  <input
                    type="text"
                    value={docForm.location}
                    onChange={(e) =>
                      setDocForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Konuşulan Diller (virgülle)
                  </label>
                  <input
                    type="text"
                    value={docLanguagesInput}
                    onChange={(e) => setDocLanguagesInput(e.target.value)}
                    placeholder="Türkçe, İngilizce"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Muayene / Çalışma Gün ve Saatleri
                </label>
                <input
                  type="text"
                  value={docForm.availableDays}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, availableDays: e.target.value }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kısa Özgeçmiş ve Klinik Deneyim
                </label>
                <textarea
                  rows={3}
                  value={docForm.bio}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={docForm.featured}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, featured: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Site vitrininde ve hekim kadrosu önizlemesinde öne çıkar</span>
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={docSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>
                    {docSaving
                      ? 'Kaydediliyor...'
                      : editingDoctor
                        ? 'Değişiklikleri Kaydet'
                        : 'Doktoru Kaydet'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Create / Edit Modal */}
      {newsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {editingNews ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setNewsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleNewsSubmit} className="space-y-4 overflow-y-auto p-6">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/30">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                  {newsForm.imageUrl ? (
                    <img
                      src={newsForm.imageUrl}
                      alt={newsForm.title || 'Haber görseli'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={newsForm.imageUrl}
                    onChange={(e) =>
                      setNewsForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="Haber görseli URL adresi..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('newsImage')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Kütüphaneden Seç</span>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Bilgisayardan Seç</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFileUpload(e, 'newsImage')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Haber Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) =>
                    setNewsForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Örn: Yeni Klinik Araştırma Sonuçları Yayınlandı"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kategori Etiketi
                  </label>
                  <input
                    type="text"
                    value={newsForm.categoryLabel}
                    onChange={(e) =>
                      setNewsForm((prev) => ({ ...prev, categoryLabel: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Yayın Tarihi
                  </label>
                  <input
                    type="date"
                    value={newsForm.publishedAt}
                    onChange={(e) =>
                      setNewsForm((prev) => ({ ...prev, publishedAt: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kaynak / Kurum
                  </label>
                  <input
                    type="text"
                    value={newsForm.source}
                    onChange={(e) =>
                      setNewsForm((prev) => ({ ...prev, source: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    İlgili Hekim / Editör
                  </label>
                  <input
                    type="text"
                    value={newsForm.doctorName}
                    onChange={(e) =>
                      setNewsForm((prev) => ({ ...prev, doctorName: e.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Haber Özeti
                </label>
                <textarea
                  rows={3}
                  value={newsForm.summary}
                  onChange={(e) =>
                    setNewsForm((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={newsSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{newsSaving ? 'Kaydediliyor...' : editingNews ? 'Haberi Güncelle' : 'Haberi Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
