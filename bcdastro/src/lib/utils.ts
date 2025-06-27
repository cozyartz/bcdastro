export function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60);
}
