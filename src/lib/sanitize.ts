import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Escape HTML entities to prevent XSS
 * @param text - The text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for display in React components
 * @param input - The user input to sanitize
 * @returns Sanitized input safe for React rendering
 */
export function sanitizeUserInput(input: string): string {
  // First escape HTML entities
  const escaped = escapeHtml(input);
  // Then sanitize any remaining HTML
  return sanitizeHtml(escaped);
}