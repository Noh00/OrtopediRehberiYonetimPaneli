import { GoogleGenAI } from '@google/genai';

export interface GroundedSource {
  title: string;
  uri: string;
}

export interface SearchGroundedResearchResult {
  summaryMarkdown: string;
  sources: GroundedSource[];
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY sunucu ortam değişkeni tanımlı değil.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function runSearchGroundedSeoResearch(params: {
  query: string;
  focusKeyword?: string;
  postTitle?: string;
  mode?: 'seo_insights' | 'article_fact_check';
}): Promise<SearchGroundedResearchResult> {
  const ai = getAiClient();
  const mode = params.mode || 'seo_insights';

  const prompt =
    mode === 'article_fact_check'
      ? `Sen profesyonel bir Türkçe editör ve araştırma asistanısın. Google Arama sonuçlarından yararlanarak aşağıdaki konu hakkında güncel, doğrulanabilir bilgiler, istatistikler ve makale içinde atıf yapılabilecek alt başlık notları derle.
Konu / Soru: ${params.query}
${params.postTitle ? `İlgili Yazı Başlığı: ${params.postTitle}` : ''}
Yanıtını Türkçe, maddeler halinde ve kısa editoryal paragraflarla ver.`
      : `Sen kıdemli bir Türkçe teknik SEO uzmanısın. Google Arama verilerini kullanarak aşağıdaki konu ve odak anahtar kelime için güncel arama trendlerini, kullanıcıların sorduğu soruları, önerilen uzun kuyruk anahtar kelimeleri ve SERP'te öne çıkacak başlık/meta açıklama açısını analiz et.
Araştırma Konusu: ${params.query}
${params.focusKeyword ? `Odak Anahtar Kelime: ${params.focusKeyword}` : ''}
${params.postTitle ? `Mevcut Başlık: ${params.postTitle}` : ''}
Yanıtını Türkçe olarak net başlıklar altında (1. Güncel Arama Eğilimi, 2. Önerilen Uzun Kuyruk Anahtar Kelimeler, 3. Başlık & Meta Önerisi, 4. İçerikte Yanıtlanması Gereken Sorular) sun.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const summaryMarkdown = (response.text || '').trim();
  const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const seenUris = new Set<string>();
  const sources: GroundedSource[] = [];
  for (const chunk of rawChunks) {
    const web = chunk?.web;
    if (web?.uri && !seenUris.has(web.uri)) {
      seenUris.add(web.uri);
      sources.push({
        title: web.title || web.uri,
        uri: web.uri,
      });
    }
  }

  return {
    summaryMarkdown,
    sources,
  };
}
