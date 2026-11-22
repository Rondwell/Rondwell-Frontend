export const QR_SIZE = 21;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isFinderCell(row: number, col: number, size: number): boolean | null {
  const corners: Array<[number, number]> = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  for (const [r0, c0] of corners) {
    const dr = row - r0;
    const dc = col - c0;
    if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) {
      if (dr === -1 || dr === 7 || dc === -1 || dc === 7) {
        return false;
      }
      if (dr === 0 || dr === 6 || dc === 0 || dc === 6) {
        return true;
      }
      if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) {
        return true;
      }
      return false;
    }
  }
  return null;
}

/**
 * Generates a deterministic 21x21 Version-1 style QR matrix with authentic
 * corner finder patterns, timing tracks, and seeded data modules.
 */
export function generateQrMatrix(seed: string): boolean[][] {
  let state = hashSeed(seed) || 1;
  const nextBit = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % 100 < 52;
  };

  const matrix: boolean[][] = Array.from({length: QR_SIZE}, () =>
    Array.from({length: QR_SIZE}, () => false),
  );

  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      const finder = isFinderCell(r, c, QR_SIZE);
      if (finder !== null) {
        matrix[r][c] = finder;
        continue;
      }
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      if (r === 13 && c === 8) {
        matrix[r][c] = true;
        continue;
      }
      matrix[r][c] = nextBit();
    }
  }

  return matrix;
}

export interface WaitlistValidationResult {
  valid: boolean;
  normalizedEmail: string;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateWaitlistEmail(raw: string): WaitlistValidationResult {
  const normalizedEmail = raw.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      valid: false,
      normalizedEmail,
      error: 'Please enter your email address.',
    };
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail,
      error: 'Enter a valid email address (e.g. you@example.com).',
    };
  }
  return {
    valid: true,
    normalizedEmail,
  };
}
