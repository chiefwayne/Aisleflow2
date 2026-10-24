const RESERVED = new Set(['admin', 'api', 'album', 'g', 'i', 't', 'owner', 'studio', 'templates', 'upgrade', 'login', 'help']);

/** Lower-case letters, numbers and single dashes, 3–40 characters (matches the database check). */
export function normalizeCustomSlug(input: string): { slug: string } | { error: string } {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length < 3 || slug.length > 40) return { error: 'Use 3 to 40 letters or numbers.' };
  if (RESERVED.has(slug)) return { error: 'That link is reserved. Please choose another.' };
  return { slug };
}
