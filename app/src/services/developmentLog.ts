/** Diagnostics stay in development; never render stack traces or send practice data. */
export function logDevelopmentError(context: string, error: unknown) {
  if (import.meta.env.DEV)
    console.error(
      context,
      error instanceof Error ? error.message : 'Unexpected error',
    );
}
