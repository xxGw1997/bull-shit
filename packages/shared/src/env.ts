export type RuntimeEnv = Record<string, string | undefined>

export function getRuntimeEnv(): RuntimeEnv {
  return typeof Bun !== 'undefined' ? Bun.env : process.env
}

export function readRequiredEnv(env: RuntimeEnv, key: string): string {
  const value = env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}
