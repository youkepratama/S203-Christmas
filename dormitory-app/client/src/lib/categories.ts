export const CATEGORY_COLORS: Record<string, string> = {
  Hadir: '#00504C',
  SK: '#2B746A',
  IZ: '#BD8C00',
  TSP: '#FFBF00',
  'Belum diisi': '#D9D9D9',
};

export const CATEGORY_LABELS: Record<string, string> = {
  SK: 'Sakit',
  IZ: 'Izin',
  TSP: 'Tidak Sesuai Prosedur',
};

export function categoryBadgeClass(kategori: string) {
  const bg = CATEGORY_COLORS[kategori] ?? '#D9D9D9';
  const dark = kategori === 'IZ' || kategori === 'TSP';
  return { backgroundColor: bg, color: dark ? '#333333' : '#FFFFFF' };
}
