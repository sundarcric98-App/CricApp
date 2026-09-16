/**
 * Date Utility Functions for CricLiveX
 * Handles conversion between UI formats (DD-MM-YYYY, DD/MM/YYYY) and PostgreSQL DATE format (YYYY-MM-DD).
 */

/**
 * Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, or ISO)
 * into a valid PostgreSQL DATE string format (YYYY-MM-DD).
 * Returns null if the input is empty or invalid.
 */
export function formatDateForPostgres(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Case 1: Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Case 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Case 3: YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Case 4: JavaScript Date parseable / ISO format
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback below
  }

  // Fallback: return today's date formatted as YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (YYYY-MM-DD or other) for user-friendly display in UI (e.g. 18 Sep 2026 or 18-09-2026).
 */
export function formatDateForDisplay(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const postgresDate = formatDateForPostgres(dateStr);
    if (!postgresDate) return dateStr;
    const [year, month, day] = postgresDate.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${parseInt(day, 10)} ${monthNames[monthIdx]} ${year}`;
    }
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}
