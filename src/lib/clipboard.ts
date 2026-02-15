/**
 * Copy text to clipboard with fallback for insecure contexts.
 * navigator.clipboard requires HTTPS or localhost; falls back to
 * a temporary textarea + execCommand('copy') for HTTP deployments.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try the modern API first (requires secure context)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // Fallback: temporary textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Move off-screen to avoid visual flash
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
