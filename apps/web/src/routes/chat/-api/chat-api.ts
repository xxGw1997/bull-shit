export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value?: { message?: string } }).value
    return value?.message ?? fallback
  }

  return fallback
}
