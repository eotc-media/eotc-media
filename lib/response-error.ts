/**
 * Turn a failed Response into something worth showing a person.
 *
 * Calling `res.json()` on an error response assumes the server sent JSON. When
 * it sends an HTML page instead — a platform error page, a redirect to sign-in,
 * an unhandled throw — the parse fails and its own error surfaces in place of
 * the real one, which is how a save failure ends up reading
 * "Unexpected token '<', "<!DOCTYPE "... is not valid JSON". That message names
 * the symptom and hides the status code, which is the one fact worth having.
 */
export async function errorMessageFrom(res: Response, fallback = "Request failed"): Promise<string> {
  const body = await res.text().catch(() => "")

  try {
    const parsed = JSON.parse(body)
    if (parsed && typeof parsed.error === "string") return parsed.error
  } catch {
    // Not JSON. Fall through to a status-based message.
  }

  if (res.status === 401) return "Your session has expired. Please sign in again."
  if (res.status === 403) return "You do not have permission to do that."
  if (res.status === 404) return "That item no longer exists."
  if (res.status === 413) return "That is too long to save."
  if (res.status >= 500) return `${fallback} — the server errored (HTTP ${res.status}). Please try again.`

  return `${fallback} (HTTP ${res.status})`
}
