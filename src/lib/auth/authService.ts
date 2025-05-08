import { mapTokensFromApi, mapUserFromApi } from './AuthDTO'
import { ApiFetcher } from '../api/fetcher'
import { Auth } from './types'

// En authService.ts
export function isTokenValid(tokens: Auth['tokens'] | null): boolean {
  if (!tokens) {
    return false
  }

  const expiresAt = new Date(tokens.accessExpiresAt)
  const now = new Date()

  return expiresAt > now
}

export const getUser = async (fetcher: ApiFetcher, token: string) => {
  const response = await fetcher(
    'GET /v1/users/me',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(response.data.message)
  }

  return mapUserFromApi(response.data)
}

export const getTokens = async (fetcher: ApiFetcher, credentials: { email: string; password: string }) => {
  const response = await fetcher('POST /v3/auth/login', {
    data: credentials,
  })

  if (!response.ok) {
    throw new Error(response.data.message)
  }

  return mapTokensFromApi(response.data)
}

export const doAppLogin = async (fetcher: ApiFetcher, credentials: { email: string; password: string }) => {
  const tokens = await getTokens(fetcher, credentials)
  const userData = await getUser(fetcher, tokens.access)

  return { tokens, userData }
}
