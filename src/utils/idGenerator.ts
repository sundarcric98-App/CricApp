/**
 * Generates an entity ID based on the first 4 letters of the name + 4-digit random number.
 * Example:
 * - "Sundar" -> "SUND4821"
 * - "Alpha Warriors" -> "ALPH9204"
 */
export const generateCustomId = (name: string): string => {
  if (!name || typeof name !== 'string') {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `CRIC${randomDigits}`;
  }

  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = cleaned.length >= 4 ? cleaned.slice(0, 4) : cleaned.padEnd(4, 'X');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}${randomDigits}`;
};

/**
 * Generates a unique Player / User ID from username with first 3 letters + 3 random digits.
 * Example:
 * - "yuvi" -> "yuv123"
 * - "virat" -> "vir482"
 * - "ms" -> "msx789"
 */
export const generatePlayerIdFromUsername = (username: string): string => {
  if (!username || typeof username !== 'string') {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    return `ply${randomDigits}`;
  }

  const cleaned = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const prefix = cleaned.length >= 3 ? cleaned.slice(0, 3) : cleaned.padEnd(3, 'x');
  const randomDigits = Math.floor(100 + Math.random() * 900);

  return `${prefix}${randomDigits}`;
};

export default generateCustomId;
