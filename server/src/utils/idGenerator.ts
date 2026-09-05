/**
 * Generates an entity ID based on the first 4 letters of the name + 4-digit random number.
 * Example:
 * - "Sundar" -> "SUND4821"
 * - "Alpha Warriors" -> "ALPH9204"
 * - "Madatugama Trophy" -> "MADA1093"
 * - "Om" -> "OMXX5521"
 */
export const generateCustomId = (name: string): string => {
  if (!name || typeof name !== 'string') {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `CRIC${randomDigits}`;
  }

  // Remove non-alphabetic characters and convert to uppercase
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  // Take first 4 characters, or pad with 'X' if shorter than 4
  const prefix = (cleaned.length >= 4 ? cleaned.slice(0, 4) : cleaned.padEnd(4, 'X'));
  
  // Generate 4-digit random number (1000 - 9999)
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}${randomDigits}`;
};

export default generateCustomId;
