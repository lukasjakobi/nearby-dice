/** Digits and capitals without easily confused characters (no 0/O, 1/I/L). 31 symbols. */
export const ROUND_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const ROUND_CODE_LENGTH = 4;

export function generateRoundCode(rng: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROUND_CODE_LENGTH; i++) {
    code += ROUND_CODE_ALPHABET[Math.floor(rng() * ROUND_CODE_ALPHABET.length)];
  }

  return code;
}

/** Upper-cases input and drops everything outside the alphabet (typing and pasting). */
export function normalizeRoundCode(input: string): string {
  return [...input.toUpperCase()]
    .filter((char) => ROUND_CODE_ALPHABET.includes(char))
    .join('')
    .slice(0, ROUND_CODE_LENGTH);
}

export function isValidRoundCode(code: string): boolean {
  return code.length === ROUND_CODE_LENGTH && normalizeRoundCode(code) === code;
}
