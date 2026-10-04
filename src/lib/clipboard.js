/**
 * clipboard.js
 * ------------------------------------------------------------------
 * Salin teks ke clipboard dengan fallback untuk browser/webview lama.
 * Clipboard API modern butuh HTTPS + izin; `execCommand` dipakai bila
 * API tersebut tidak tersedia atau ditolak.
 *
 * @returns {Promise<boolean>} true bila teks berhasil disalin
 */
export async function copyText(text) {
  const value = String(text ?? '');

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      /* jatuh ke fallback di bawah (izin ditolak / bukan HTTPS) */
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}
