import DOMPurify from 'isomorphic-dompurify'

// Rich text submitted by members — quiz questions and choices, lyrics
// suggestions, sermon description suggestions — is rendered with
// dangerouslySetInnerHTML. Some of those renders happen inside the admin panel
// while a moderator reviews the submission, so unsanitised input would run
// script in an admin's session, not just a visitor's. Clean it on the way in so
// nothing dangerous is ever stored.
//
// The allowlist matches what the rich text editor can actually produce.
const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'a',
]

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'dir']

/** Strip scripts, event handlers and unknown tags from user-supplied HTML. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // javascript:/data: URLs in links
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
  })
}

/** Sanitize when present, preserving null/undefined. */
export function sanitizeHtmlNullable<T extends string | null | undefined>(dirty: T): T {
  if (dirty === null || dirty === undefined) return dirty
  return sanitizeHtml(dirty) as T
}
