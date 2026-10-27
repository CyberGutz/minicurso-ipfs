export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 || value >= 10 ? 0 : 1)} ${units[i]}`;
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDate = (ts) => dateFmt.format(new Date(ts));

export const shortCid = (cid) => (cid.length > 18 ? `${cid.slice(0, 8)}…${cid.slice(-6)}` : cid);

export const extensionOf = (name) => (name.includes('.') ? name.split('.').pop().slice(0, 5) : 'arq');

// Cor da miniatura de acordo com o tipo do arquivo
const KINDS = [
  { exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'], cls: 'bg-amber-100 text-amber-800' },
  { exts: ['mp4', 'mov', 'webm', 'mkv'], cls: 'bg-violet-100 text-violet-800' },
  { exts: ['mp3', 'wav', 'flac', 'ogg'], cls: 'bg-rose-100 text-rose-800' },
  { exts: ['pdf'], cls: 'bg-red-100 text-red-800' },
  { exts: ['doc', 'docx', 'txt', 'md', 'odt'], cls: 'bg-sky-100 text-sky-800' },
  { exts: ['xls', 'xlsx', 'csv', 'ods'], cls: 'bg-emerald-100 text-emerald-800' },
  { exts: ['zip', 'rar', '7z', 'tar', 'gz'], cls: 'bg-stone-200 text-stone-700' },
  { exts: ['js', 'ts', 'json', 'html', 'css', 'py', 'go', 'rs'], cls: 'bg-teal-100 text-teal-800' }
];

export function kindClass(name) {
  const ext = extensionOf(name).toLowerCase();
  return KINDS.find((k) => k.exts.includes(ext))?.cls ?? 'bg-slate-200 text-slate-700';
}
