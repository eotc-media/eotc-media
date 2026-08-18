import sanitize from 'sanitize-html'

// Rich text submitted by members — quiz questions and choices, lyrics
// suggestions, sermon description suggestions — is rendered with
// dangerouslySetInnerHTML. Some of those renders happen inside the admin panel
// while a moderator reviews the submission, so unsanitised input would run
// script in an admin's session, not just a visitor's. Clean it on the way in so
// nothing dangerous is ever stored.
//
// This used isomorphic-dompurify, which needs a DOM and so pulls in jsdom. On
// Vercel that failed to load at all — jsdom's html-encoding-sniffer require()s
// an ES module, which throws ERR_REQUIRE_ESM — and because the failure happened
// while the module was being imported rather than inside a handler, it took the
// whole route down before any code ran. sanitize-html parses with htmlparser2
// instead and needs no DOM.
//
// The allowlist matches what the rich text editor can actually produce.
const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'a',
]

const OPTIONS: sanitize.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ['title', 'dir'],
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  // Relative and in-page links stay usable; protocol-relative ones do not,
  // since they inherit whatever scheme the page was loaded over.
  allowProtocolRelative: false,
  // A link opening in a new tab hands the opener to the target without this.
  transformTags: {
    a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
  disallowedTagsMode: 'discard',
}

/** Strip scripts, event handlers and unknown tags from user-supplied HTML. */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, OPTIONS)
}

/** Sanitize when present, preserving null/undefined. */
export function sanitizeHtmlNullable<T extends string | null | undefined>(dirty: T): T {
  if (dirty === null || dirty === undefined) return dirty
  return sanitizeHtml(dirty) as T
}
