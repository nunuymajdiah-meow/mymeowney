export type Colors = {
  bg: string; card: string; primary: string; primaryDark: string; yellow: string;
  text: string; sub: string; border: string;
  income: string; incomeBg: string; expense: string; expenseBg: string;
  gradA: string; gradB: string; // pasangan warna gradasi
};
export type Palette = { id: string; name: string; emoji: string; isDark: boolean; colors: Colors };

const soft = { income: '#5DB37E', incomeBg: '#E3F5EA', expense: '#EF7F7A', expenseBg: '#FDE6E4' };

export const PALETTES: Palette[] = [
  { id: 'krem-oranye', name: 'Krem Oranye', emoji: '🍊', isDark: false, colors: {
    bg: '#FFF8EE', card: '#FFFFFF', primary: '#FFB866', primaryDark: '#E8892B', yellow: '#FFE6A7',
    text: '#4A3B2F', sub: '#9A8878', border: '#F1E4D3', ...soft, gradA: '#FFE9B8', gradB: '#FFC98A' } },
  { id: 'peach-sunset', name: 'Peach Sunset', emoji: '🍑', isDark: false, colors: {
    bg: '#FFF4F0', card: '#FFFFFF', primary: '#FF9E8A', primaryDark: '#E5705A', yellow: '#FFD9CC',
    text: '#4F3631', sub: '#A07F78', border: '#F5DDD6', ...soft, gradA: '#FFD3B6', gradB: '#FFAAA5' } },
  { id: 'matcha-mint', name: 'Matcha Mint', emoji: '🍵', isDark: false, colors: {
    bg: '#F2FAF4', card: '#FFFFFF', primary: '#7CC6A4', primaryDark: '#3E9F78', yellow: '#D4F0E0',
    text: '#2F4A3E', sub: '#7C9A8C', border: '#D9EBE0', ...soft, gradA: '#D5F2D0', gradB: '#9BDDC0' } },
  { id: 'blueberry-sky', name: 'Blueberry Sky', emoji: '🫐', isDark: false, colors: {
    bg: '#F3F7FF', card: '#FFFFFF', primary: '#8FB4FF', primaryDark: '#5280E0', yellow: '#DDE8FF',
    text: '#2E3A59', sub: '#8090B0', border: '#DCE5F7', ...soft, gradA: '#CFE0FF', gradB: '#D4C6FF' } },
  { id: 'sakura-pink', name: 'Sakura Pink', emoji: '🌸', isDark: false, colors: {
    bg: '#FFF3F8', card: '#FFFFFF', primary: '#FF9BBF', primaryDark: '#E0638F', yellow: '#FFDDEA',
    text: '#5A3345', sub: '#A8808F', border: '#F8DCE7', ...soft, gradA: '#FFD6E7', gradB: '#E9C8FF' } },
  { id: 'lavender-dream', name: 'Lavender Dream', emoji: '💜', isDark: false, colors: {
    bg: '#F8F4FF', card: '#FFFFFF', primary: '#B79CFF', primaryDark: '#8A63E8', yellow: '#E8DEFF',
    text: '#3E3358', sub: '#8F84AE', border: '#E6DDF7', ...soft, gradA: '#E3D0FF', gradB: '#BFE0FF' } },
  { id: 'midnight-meow', name: 'Midnight Meow (gelap)', emoji: '🌙', isDark: true, colors: {
    bg: '#1D1A2B', card: '#2A2640', primary: '#A78BFA', primaryDark: '#8B6CF0', yellow: '#3A3556',
    text: '#F1ECFF', sub: '#A9A3C4', border: '#3B3658',
    income: '#6FD9A0', incomeBg: '#1F3A34', expense: '#FF8F8A', expenseBg: '#43292F',
    gradA: '#4B3F8F', gradB: '#7A5BD0' } },
];

export const DEFAULT_PALETTE_ID = PALETTES[0].id;

// Objek ini diubah isinya saat tema diganti, jadi semua layar yang membaca `colors` ikut berubah.
export const colors: Colors = { ...PALETTES[0].colors };

export function applyPalette(id: string) {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  Object.assign(colors, p.colors);
}
