/**
 * Formats a number as Algerian Dinar (DZD / د.ج)
 */
export function formatDZD(amount: number, locale: 'ar' | 'fr' = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);

  return locale === 'ar' ? `${formatted} د.ج` : `${formatted} DA`;
}

/**
 * Formats an ISO date string or YYYY-MM-DD to a human-readable date.
 */
export function formatDate(dateString: string, locale: 'ar' | 'fr' = 'ar'): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formats ISO string to local HH:mm time.
 */
export function formatTime(isoString: string, locale: 'ar' | 'fr' = 'ar'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Helper to generate simple random UUID v4 string if crypto.randomUUID is not available.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
