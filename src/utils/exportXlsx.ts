import { strToU8, zipSync } from 'fflate';
import { buildXlsxFiles } from './xlsxFiles';
import type { Sheet } from './xlsxFiles';

// Menyusun isi .xlsx menjadi satu file zip (format .xlsx adalah zip berisi XML).
export function buildXlsx(sheets: Sheet[]): Uint8Array {
  const input: Record<string, Uint8Array> = {};
  Object.entries(buildXlsxFiles(sheets)).forEach(([path, text]) => { input[path] = strToU8(text); });
  return zipSync(input, { level: 6 });
}
