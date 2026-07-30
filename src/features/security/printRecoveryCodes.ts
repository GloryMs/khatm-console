/**
 * Opens a blank, same-origin popup with just the recovery codes and prints
 * it — a self-contained print view rather than printing the whole console
 * (which would include app chrome and, if the dialog is a modal, nothing
 * useful behind it). No network request, no external content.
 */
export function printRecoveryCodes(title: string, codes: string[]): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
  if (!printWindow) return;
  const body = [title, '', ...codes].map((line) => escapeHtml(line)).join('\n');
  printWindow.document.write(`<pre style="font: 14px/1.6 monospace; white-space: pre-wrap;">
${body}
</pre>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
  );
}
