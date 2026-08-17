import { NextResponse } from 'next/server'

/**
 * Run a route handler and turn anything it throws into a logged, JSON 500.
 *
 * An uncaught throw in a route handler becomes a platform error page — HTML,
 * with no detail — which tells the person nothing and leaves nothing useful in
 * the logs either. Wrapping the body means the stack reaches the log with a tag
 * you can search for, and the caller gets JSON it can actually read.
 */
export async function handleRoute(
  tag: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn()
  } catch (e) {
    const err = e as Error
    console.error(`[${tag}] unhandled error:`, err?.message, '\n', err?.stack)
    return NextResponse.json(
      { error: 'Something went wrong on our side. Please try again.' },
      { status: 500 }
    )
  }
}
