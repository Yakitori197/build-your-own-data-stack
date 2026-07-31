/**
 * Bilingual UI strings (English + Traditional Chinese).
 *
 * Entry *content* (summaries, outcomes) is English-only by policy, but the UI
 * chrome is fully bilingual. Strings are rendered into the HTML in both
 * languages via the <T> component; a small client script swaps the visible
 * language and persists the choice in localStorage.
 */

export type Locale = 'en' | 'zh-TW';

export interface Bilingual {
  readonly en: string;
  readonly 'zh-TW': string;
}

export const UI = {
  tagline: {
    en: 'Learn data infrastructure by rebuilding it from first principles.',
    'zh-TW': '從第一原理親手重建，學會資料基礎設施。',
  },
  navHome: { en: 'Home', 'zh-TW': '首頁' },
  navCatalog: { en: 'Catalog', 'zh-TW': '目錄' },
  navPaths: { en: 'Learning paths', 'zh-TW': '學習路線' },
  browseCatalog: { en: 'Browse the catalog', 'zh-TW': '瀏覽目錄' },
  viewPaths: { en: 'See learning paths', 'zh-TW': '看學習路線' },
  heroBody: {
    en: 'A community-curated map of hands-on resources for building databases, storage engines, query engines, and the rest of the modern data stack — yourself.',
    'zh-TW':
      '由社群整理的實作資源地圖，帶你親手打造資料庫、儲存引擎、查詢引擎，以及現代資料技術堆疊的其他組件。',
  },
  entries: { en: 'entries', 'zh-TW': '筆資源' },
  categories: { en: 'categories', 'zh-TW': '個分類' },
  paths: { en: 'learning paths', 'zh-TW': '條學習路線' },
  languages: { en: 'languages', 'zh-TW': '種語言' },
  featured: { en: 'Where to start', 'zh-TW': '從哪裡開始' },
  browseByCategory: { en: 'Browse by category', 'zh-TW': '依分類瀏覽' },
  filters: { en: 'Filters', 'zh-TW': '篩選' },
  search: { en: 'Search', 'zh-TW': '搜尋' },
  searchPlaceholder: { en: 'Search titles, summaries, tags…', 'zh-TW': '搜尋標題、摘要、標籤…' },
  category: { en: 'Category', 'zh-TW': '分類' },
  difficulty: { en: 'Difficulty', 'zh-TW': '難度' },
  language: { en: 'Language', 'zh-TW': '程式語言' },
  maxHours: { en: 'Max hours', 'zh-TW': '時數上限' },
  freeOnly: { en: 'Free only', 'zh-TW': '僅免費' },
  openSourceOnly: { en: 'Open source only', 'zh-TW': '僅開源' },
  all: { en: 'All', 'zh-TW': '全部' },
  any: { en: 'Any', 'zh-TW': '不限' },
  reset: { en: 'Reset filters', 'zh-TW': '清除篩選' },
  showing: { en: 'Showing', 'zh-TW': '顯示' },
  of: { en: 'of', 'zh-TW': '／共' },
  noResults: {
    en: 'No resources match these filters. Try widening your search.',
    'zh-TW': '沒有符合條件的資源，試著放寬篩選條件。',
  },
  markDone: { en: 'Mark done', 'zh-TW': '標記完成' },
  done: { en: 'Done', 'zh-TW': '已完成' },
  progressLabel: { en: 'Your progress', 'zh-TW': '你的進度' },
  beginner: { en: 'Beginner', 'zh-TW': '入門' },
  intermediate: { en: 'Intermediate', 'zh-TW': '進階' },
  advanced: { en: 'Advanced', 'zh-TW': '高階' },
  free: { en: 'Free', 'zh-TW': '免費' },
  paid: { en: 'Paid', 'zh-TW': '付費' },
  openSource: { en: 'Open source', 'zh-TW': '開源' },
  hours: { en: 'hours', 'zh-TW': '小時' },
  source: { en: 'Go to resource', 'zh-TW': '前往資源' },
  overview: { en: 'Overview', 'zh-TW': '概覽' },
  prerequisites: { en: 'Prerequisites', 'zh-TW': '先備知識' },
  learningOutcomes: { en: "What you'll learn", 'zh-TW': '你會學到' },
  details: { en: 'At a glance', 'zh-TW': '快速資訊' },
  estimatedTime: { en: 'Estimated time', 'zh-TW': '預估時間' },
  authors: { en: 'By', 'zh-TW': '作者' },
  sourceType: { en: 'Format', 'zh-TW': '形式' },
  lastVerified: { en: 'Last reviewed', 'zh-TW': '最後檢視' },
  inThisCategory: { en: 'In this category', 'zh-TW': '此分類的資源' },
  notFound: { en: 'Page not found', 'zh-TW': '找不到頁面' },
  notFoundBody: {
    en: 'The page you were looking for does not exist.',
    'zh-TW': '你要找的頁面不存在。',
  },
  backHome: { en: 'Back to home', 'zh-TW': '回到首頁' },
  privacyNote: {
    en: 'No accounts, no tracking. Your progress stays in this browser.',
    'zh-TW': '沒有帳號、沒有追蹤。你的進度只留在這個瀏覽器。',
  },
  steps: { en: 'steps', 'zh-TW': '個步驟' },
} as const satisfies Record<string, Bilingual>;

export type UIKey = keyof typeof UI;
