import { mapTokensFromApi, mapUserFromApi } from './AuthDTO'
import { ApiFetcher } from '../api/fetcher'
import { Auth, AuthInitializeConfig } from './types'

// En authService.ts
export function isTokenValid(tokens: Auth['tokens'] | null): boolean {
  if (!tokens) {
    return false
  }

  const expiresAt = new Date(tokens.accessExpiresAt)
  const now = new Date()

  return expiresAt > now
}

export function isRefreshTokenValid(tokens: Auth['tokens'] | null): boolean {
  if (!tokens) {
    return false
  }

  const expiresAt = new Date(tokens.refreshExpiresAt)
  const now = new Date()

  return expiresAt > now
}

export const refreshTokens = async (fetcher: ApiFetcher, refreshToken: string) => {
  const response = await fetcher('POST /v3/auth/refresh', {
    data: {
      refreshToken,
    },
  })

  if (!response.ok) {
    throw new Error(response.data.message)
  }

  return mapTokensFromApi(response.data)
}

export const getRefreshTimeout = (tokens: Auth['tokens']) => {
  if (!tokens) {
    throw new Error('No tokens available')
  }

  const expiresAt = new Date(tokens.accessExpiresAt)
  const now = new Date()

  // Calculate the time difference in milliseconds
  const timeDiff = expiresAt.getTime() - now.getTime()

  // Tests has tokens with expiration date of years! if that's the case, we change the token refresh timeout to 24 hours
  // Limit to maximum 24 hours (24 * 60 * 60 * 1000 = 86400000 milliseconds)
  return Math.min(timeDiff, 86400000)
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

export const getUserAndTokensFromInitialTokens = async (
  fetcher: ApiFetcher,
  initialTokens: AuthInitializeConfig['initialTokens'],
) => {
  let tokens: Auth['tokens'] | null = null
  let userData: Auth['currentUser'] | null = null

  if (initialTokens) {
    if (initialTokens instanceof Promise) {
      const tokenResponse = await initialTokens

      if (tokenResponse) {
        tokens = tokenResponse
      }
    } else {
      tokens = initialTokens
    }

    if (tokens && isTokenValid(tokens)) {
      userData = await getUser(fetcher, tokens.access)
    }
  }

  return { tokens, userData }
}
