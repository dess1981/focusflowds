/**
 * Converte string de data "yyyy-MM-dd" para Date no fuso local,
 * evitando o bug de UTC que causa datas com -1 dia.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}