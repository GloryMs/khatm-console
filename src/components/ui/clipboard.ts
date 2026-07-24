/**
 * `navigator.clipboard` requires a secure context (HTTPS, or the
 * `localhost`/`127.0.0.1` special case) and is `undefined` otherwise — e.g.
 * the console reached over plain HTTP via a LAN IP, which is how an operator
 * opens it from another machine on the network. Falls back to the legacy
 * `execCommand('copy')` path via a hidden textarea, which carries no such
 * restriction, so copy buttons keep working in that case.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  }
  document.body.removeChild(textarea);
  return succeeded;
}
