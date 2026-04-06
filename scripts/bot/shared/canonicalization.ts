/**
 * URL Canonicalization
 * 
 * Features:
 * - Remove tracking params
 * - Normalize http/https
 * - Normalize trailing slash
 *
 * @module shared/canonicalization
 */

export function canonicalizeUrl(url: string): string {
  if (!url) return '';

  try {
    let normalized = url.trim();

    normalized = normalized.replace(/^http:\/\//i, 'https://');

    let urlObj = new URL(normalized);

    urlObj.hostname = urlObj.hostname.toLowerCase();

    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'dclid', 'msclkid',
      'ref', 'referrer', 'source',
      'mc_cid', 'mc_eid',
      '_ga', '_gl',
      'share', 'social',
    ];

    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    const dangerousParams = ['token', 'session', 'auth', 'password', 'key'];
    dangerousParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');

    if (urlObj.pathname === '') {
      urlObj.pathname = '/';
    }

    urlObj.search = Array.from(urlObj.searchParams.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    if (urlObj.search) {
      urlObj.search = '?' + urlObj.search;
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateTitleHash(title: string): string {
  const normalized = normalizeTitle(title);
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

export function extractArxivId(urlOrId: string): string | null {
  const patterns = [
    /arxiv\.org\/abs\/([0-9]+\.[0-9]+v?[0-9]*)/i,
    /arxiv\.org\/pdf\/([0-9]+\.[0-9]+v?[0-9]*)/i,
    /^([0-9]+\.[0-9]+v?[0-9]*)$/i,
    /([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)/,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

export function extractDoi(urlOrDoi: string): string | null {
  const patterns = [
    /doi\.org\/([^\s]+)/i,
    /doi:([^\s]+)/i,
    /^10\.\d{4,}\/[^\s]+$/,
  ];

  for (const pattern of patterns) {
    const match = urlOrDoi.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

