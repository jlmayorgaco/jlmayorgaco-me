/**
 * Paper entity value object
 */
export interface Paper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  categories: string[];
  url: string;
  pdfUrl?: string;
  relevance?: 'high' | 'medium' | 'low';
  summaryShort?: string;
  classification?: string;
  relevanceScore?: number;
}

/**
 * News item entity value object
 */
export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  categories: string[];
}

/**
 * Blog post entity
 */
export interface BlogPost {
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  content: string;
  featured: boolean;
  imageQuery?: string;
  imagePath?: string;
}

