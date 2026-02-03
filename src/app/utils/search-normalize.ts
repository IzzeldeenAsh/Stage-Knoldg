// Shared search normalization for Arabic/English text.
// Makes search tolerant to: hamza/alif variants, diacritics (tashkeel), and tatweel.

const ARABIC_DIACRITICS_AND_TATWEEL_RE = /[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeSearchText(input: string): string {
  if (!input) return '';
  let s = input.toLowerCase().trim();

  // Remove tashkeel + tatweel
  s = s.replace(ARABIC_DIACRITICS_AND_TATWEEL_RE, '');

  // Normalize common Arabic variants
  s = s.replace(/[إأآٱ]/g, 'ا');
  s = s.replace(/[ؤ]/g, 'و');
  s = s.replace(/[ئ]/g, 'ي');
  s = s.replace(/[ء]/g, '');
  s = s.replace(/[ى]/g, 'ي');

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ');
  return s;
}

