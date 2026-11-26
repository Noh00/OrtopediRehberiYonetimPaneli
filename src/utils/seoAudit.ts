import { BlogPost } from '../types/admin';

export function slugifyTurkish(text: string): string {
  const map: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };

  return text
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface SeoCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: 'good' | 'warn' | 'error';
}

export interface SeoAuditResult {
  score: number;
  checks: SeoCheckItem[];
  wordCount: number;
  keywordCount: number;
  keywordDensityPct: number;
}

export function evaluatePostSeo(post: BlogPost): SeoAuditResult {
  const keyword = post.seo.focusKeyword.trim().toLowerCase();
  const seoTitle = (post.seo.seoTitle || post.title).trim();
  const metaDesc = (post.seo.metaDescription || post.excerpt).trim();
  const plainContent = post.content.replace(/[#*_`>\-\[\]()]/g, ' ').trim();
  const words = plainContent ? plainContent.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  let keywordCount = 0;
  if (keyword.length >= 2) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    keywordCount = (plainContent.match(regex) || []).length;
  }
  const keywordDensityPct =
    wordCount > 0 && keywordCount > 0
      ? Number(((keywordCount / wordCount) * 100).toFixed(2))
      : 0;

  const titleLen = seoTitle.length;
  const descLen = metaDesc.length;
  const hasH2 = /^##\s+/m.test(post.content);
  const hasInternalLink = /\]\(\//.test(post.content);
  const hasCoverAlt = post.coverAlt.trim().length >= 8;
  const keywordInTitle = keyword.length >= 2 && seoTitle.toLowerCase().includes(keyword);
  const keywordInMeta = keyword.length >= 2 && metaDesc.toLowerCase().includes(keyword);
  const keywordInSlug =
    keyword.length >= 2 && post.slug.toLowerCase().includes(slugifyTurkish(keyword));

  const checks: SeoCheckItem[] = [
    {
      id: 'title_length',
      label: 'SEO Başlık Uzunluğu',
      passed: titleLen >= 40 && titleLen <= 62,
      detail: `${titleLen} karakter (önerilen 40–62 karakter)`,
      severity: titleLen >= 40 && titleLen <= 62 ? 'good' : titleLen >= 25 ? 'warn' : 'error',
    },
    {
      id: 'meta_length',
      label: 'Meta Açıklama Uzunluğu',
      passed: descLen >= 115 && descLen <= 160,
      detail: `${descLen} karakter (önerilen 115–160 karakter)`,
      severity: descLen >= 115 && descLen <= 160 ? 'good' : descLen >= 80 ? 'warn' : 'error',
    },
    {
      id: 'focus_keyword_title',
      label: 'Odak Anahtar Kelime Başlıkta',
      passed: keywordInTitle,
      detail: keyword
        ? keywordInTitle
          ? `"${post.seo.focusKeyword}" başlıkta yer alıyor`
          : `"${post.seo.focusKeyword}" SEO başlığına eklenmeli`
        : 'Odak anahtar kelime tanımlanmamış',
      severity: keywordInTitle ? 'good' : 'error',
    },
    {
      id: 'focus_keyword_meta_slug',
      label: 'Anahtar Kelime Meta & URL Slug',
      passed: keywordInMeta && keywordInSlug,
      detail:
        keywordInMeta && keywordInSlug
          ? 'Meta açıklama ve URL slug uyumlu'
          : 'Meta açıklama veya URL slug odak kelimeyi içermiyor',
      severity: keywordInMeta && keywordInSlug ? 'good' : keywordInMeta || keywordInSlug ? 'warn' : 'error',
    },
    {
      id: 'content_depth',
      label: 'İçerik Derinliği ve Alt Başlıklar',
      passed: wordCount >= 120 && hasH2,
      detail: `${wordCount} kelime · ${hasH2 ? 'H2 alt başlık mevcut' : 'H2 alt başlık eksik'}`,
      severity: wordCount >= 120 && hasH2 ? 'good' : wordCount >= 60 ? 'warn' : 'error',
    },
    {
      id: 'media_links',
      label: 'Görsel Alt Metin ve İç Bağlantı',
      passed: hasCoverAlt && hasInternalLink,
      detail: `${hasCoverAlt ? 'Alt metin tanımlı' : 'Alt metin kısa/eksik'} · ${hasInternalLink ? 'İç bağlantı var' : 'İç bağlantı önerilir'}`,
      severity: hasCoverAlt && hasInternalLink ? 'good' : hasCoverAlt || hasInternalLink ? 'warn' : 'error',
    },
  ];

  const earned = checks.reduce((acc, item) => {
    if (item.severity === 'good') return acc + 100 / checks.length;
    if (item.severity === 'warn') return acc + 50 / checks.length;
    return acc;
  }, 0);

  return {
    score: Math.round(earned),
    checks,
    wordCount,
    keywordCount,
    keywordDensityPct,
  };
}

export interface SeoLengthMetric {
  id: 'title' | 'keyword' | 'meta';
  label: string;
  currentLength: number;
  unitLabel: string;
  minIdeal: number;
  maxIdeal: number;
  maxScale: number;
  status: 'good' | 'warn' | 'error';
  statusText: string;
}

export interface SeoRecommendation {
  id: string;
  area: 'Başlık' | 'Anahtar Kelime' | 'Meta Açıklama';
  severity: 'warn' | 'error';
  message: string;
  actionLabel?: string;
  actionType?: 'trim_title' | 'add_keyword_title' | 'fill_meta_excerpt' | 'trim_meta' | 'add_keyword_meta';
}

export interface SeoScoringDetails {
  overallScore: number;
  gradeLabel: string;
  metrics: SeoLengthMetric[];
  recommendations: SeoRecommendation[];
}

export function evaluateSeoScoringDetails(post: BlogPost): SeoScoringDetails {
  const baseAudit = evaluatePostSeo(post);
  const seoTitle = (post.seo.seoTitle || post.title).trim();
  const metaDesc = (post.seo.metaDescription || post.excerpt).trim();
  const keyword = post.seo.focusKeyword.trim();
  const keywordWords = keyword ? keyword.split(/\s+/).filter(Boolean).length : 0;

  const titleLen = seoTitle.length;
  const keywordLen = keyword.length;
  const metaLen = metaDesc.length;

  const titleStatus: SeoLengthMetric['status'] =
    titleLen >= 40 && titleLen <= 62
      ? 'good'
      : titleLen >= 25 && titleLen <= 70
        ? 'warn'
        : 'error';

  const titleStatusText =
    titleLen === 0
      ? 'Başlık boş'
      : titleLen < 40
        ? 'Çok kısa'
        : titleLen <= 62
          ? 'İdeal aralık'
          : 'Çok uzun (kesilebilir)';

  const keywordStatus: SeoLengthMetric['status'] =
    keywordLen >= 6 && keywordLen <= 35 && keywordWords >= 1 && keywordWords <= 4
      ? 'good'
      : keywordLen >= 3 && keywordLen <= 50
        ? 'warn'
        : 'error';

  const keywordStatusText =
    keywordLen === 0
      ? 'Tanımlanmamış'
      : keywordLen < 6
        ? 'Çok genel / kısa'
        : keywordWords > 4 || keywordLen > 35
          ? 'Çok uzun kuyruk'
          : 'İdeal uzunluk';

  const metaStatus: SeoLengthMetric['status'] =
    metaLen >= 115 && metaLen <= 160
      ? 'good'
      : metaLen >= 80 && metaLen <= 175
        ? 'warn'
        : 'error';

  const metaStatusText =
    metaLen === 0
      ? 'Açıklama eksik'
      : metaLen < 115
        ? 'Kısa (tıklama potansiyeli düşük)'
        : metaLen <= 160
          ? 'İdeal aralık'
          : 'Uzun (160 karakter sonrası kırpılır)';

  const metrics: SeoLengthMetric[] = [
    {
      id: 'title',
      label: 'SEO Başlık Uzunluğu',
      currentLength: titleLen,
      unitLabel: 'karakter (ideal 40–62)',
      minIdeal: 40,
      maxIdeal: 62,
      maxScale: 80,
      status: titleStatus,
      statusText: titleStatusText,
    },
    {
      id: 'keyword',
      label: 'Odak Anahtar Kelime',
      currentLength: keywordLen,
      unitLabel: `karakter · ${keywordWords} kelime (ideal 6–35 krk)`,
      minIdeal: 6,
      maxIdeal: 35,
      maxScale: 50,
      status: keywordStatus,
      statusText: keywordStatusText,
    },
    {
      id: 'meta',
      label: 'Meta Açıklama Uzunluğu',
      currentLength: metaLen,
      unitLabel: 'karakter (ideal 115–160)',
      minIdeal: 115,
      maxIdeal: 160,
      maxScale: 200,
      status: metaStatus,
      statusText: metaStatusText,
    },
  ];

  const recommendations: SeoRecommendation[] = [];

  if (titleLen < 40) {
    recommendations.push({
      id: 'rec-title-short',
      area: 'Başlık',
      severity: titleLen < 25 ? 'error' : 'warn',
      message: `SEO başlığınız ${titleLen} karakter. Arama sonuçlarında daha fazla yer kaplamak için 40–62 karakter aralığına genişletin.`,
    });
  } else if (titleLen > 62) {
    recommendations.push({
      id: 'rec-title-long',
      area: 'Başlık',
      severity: titleLen > 70 ? 'error' : 'warn',
      message: `SEO başlığınız ${titleLen} karakter; Google SERP’te 62 karakterden sonrası "..." ile kesilebilir.`,
      actionLabel: '60 karaktere kısalt',
      actionType: 'trim_title',
    });
  }

  if (keywordLen === 0) {
    recommendations.push({
      id: 'rec-kw-empty',
      area: 'Anahtar Kelime',
      severity: 'error',
      message: 'Odak anahtar kelime belirlenmemiş. Yazının hedeflediği ana arama terimini (2–4 kelime) girin.',
    });
  } else {
    if (keywordLen < 6) {
      recommendations.push({
        id: 'rec-kw-short',
        area: 'Anahtar Kelime',
        severity: 'warn',
        message: `"${keyword}" oldukça kısa (${keywordLen} karakter). Daha spesifik, uzun kuyruklu bir ifade rekabet avantajı sağlar.`,
      });
    } else if (keywordWords > 4 || keywordLen > 35) {
      recommendations.push({
        id: 'rec-kw-long',
        area: 'Anahtar Kelime',
        severity: 'warn',
        message: `Odak anahtar kelime ${keywordWords} kelimeden (${keywordLen} karakter) oluşuyor. 2–4 kelimelik net bir öbek seçin.`,
      });
    }

    if (!seoTitle.toLowerCase().includes(keyword.toLowerCase())) {
      recommendations.push({
        id: 'rec-kw-in-title',
        area: 'Anahtar Kelime',
        severity: 'error',
        message: `Odak anahtar kelime ("${keyword}") SEO başlığında geçmiyor. Başlığın ilk yarısına eklemeniz önerilir.`,
        actionLabel: 'Başlığa ekle',
        actionType: 'add_keyword_title',
      });
    }

    if (!metaDesc.toLowerCase().includes(keyword.toLowerCase())) {
      recommendations.push({
        id: 'rec-kw-in-meta',
        area: 'Anahtar Kelime',
        severity: 'warn',
        message: `Odak anahtar kelime ("${keyword}") meta açıklamada yer almıyor. Arama eşleşmelerini kalınlaştırmak için ekleyin.`,
        actionLabel: 'Meta açıklamaya ekle',
        actionType: 'add_keyword_meta',
      });
    }

    if (baseAudit.keywordDensityPct > 3.0) {
      recommendations.push({
        id: 'rec-kw-density-high',
        area: 'Anahtar Kelime',
        severity: 'warn',
        message: `Anahtar kelime yoğunluğu %${baseAudit.keywordDensityPct} ile yüksek. Aşırı tekrar (keyword stuffing) algısını önlemek için %1–%2,5 bandında tutun.`,
      });
    } else if (baseAudit.keywordCount === 0) {
      recommendations.push({
        id: 'rec-kw-density-zero',
        area: 'Anahtar Kelime',
        severity: 'warn',
        message: `Odak anahtar kelime ("${keyword}") makale gövdesinde hiç geçmiyor. Doğal akış içinde 2–3 kez kullanın.`,
      });
    }
  }

  if (metaLen === 0) {
    recommendations.push({
      id: 'rec-meta-empty',
      area: 'Meta Açıklama',
      severity: 'error',
      message: 'Meta açıklama boş bırakılmış. 115–160 karakter arasında harekete geçirici bir özet girin.',
      actionLabel: post.excerpt ? 'Yazı özetinden doldur' : undefined,
      actionType: post.excerpt ? 'fill_meta_excerpt' : undefined,
    });
  } else if (metaLen < 115) {
    recommendations.push({
      id: 'rec-meta-short',
      area: 'Meta Açıklama',
      severity: metaLen < 80 ? 'error' : 'warn',
      message: `Meta açıklamanız ${metaLen} karakter. Tıklama oranını artırmak için en az 115 karaktere tamamlayın.`,
    });
  } else if (metaLen > 160) {
    recommendations.push({
      id: 'rec-meta-long',
      area: 'Meta Açıklama',
      severity: metaLen > 175 ? 'error' : 'warn',
      message: `Meta açıklamanız ${metaLen} karakter; arama sonuçlarında 160 karakter sınırı nedeniyle kesilecektir.`,
      actionLabel: '158 karaktere sığdır',
      actionType: 'trim_meta',
    });
  }

  const gradeLabel =
    baseAudit.score >= 85
      ? 'Mükemmel'
      : baseAudit.score >= 65
        ? 'İyi · İyileştirilebilir'
        : baseAudit.score >= 45
          ? 'Orta · Düzenleme Gerekli'
          : 'Zayıf · Acil İyileştirme';

  return {
    overallScore: baseAudit.score,
    gradeLabel,
    metrics,
    recommendations,
  };
}

export function formatNumberTR(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

export function formatDurationTR(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins} dk ${secs.toString().padStart(2, '0')} sn`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
