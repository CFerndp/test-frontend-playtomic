import { User } from '../api-types'
import { Auth } from './types'

export const mapTokensFromApi = (apiTokens: {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}): NonNullable<Auth['tokens']> => ({
  access: apiTokens.accessToken,
  accessExpiresAt: apiTokens.accessTokenExpiresAt,
  refresh: apiTokens.refreshToken,
  refreshExpiresAt: apiTokens.refreshTokenExpiresAt,
})

export const mapUserFromApi = (apiUser: User): NonNullable<Auth['currentUser']> => ({
  userId: apiUser.userId,
  name: apiUser.displayName,
  email: apiUser.email ?? '',
})
