import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getUserAndTokensFromInitialTokens,
  isTokenValid,
  isRefreshTokenValid,
  refreshTokens,
  doAppLogin,
  getRefreshTimeout,
} from './authService'

describe('authService', () => {
  const mockFetcher = vi.fn()

  const futureDate = new Date()
  futureDate.setHours(futureDate.getHours() + 1)
  const pastDate = new Date()
  pastDate.setHours(pastDate.getHours() - 1)

  const validTokens = {
    access: 'valid-access-token',
    accessExpiresAt: futureDate.toISOString(),
    refresh: 'valid-refresh-token',
    refreshExpiresAt: futureDate.toISOString(),
  }

  const expiredTokens = {
    access: 'expired-access-token',
    accessExpiresAt: pastDate.toISOString(),
    refresh: 'expired-refresh-token',
    refreshExpiresAt: pastDate.toISOString(),
  }

  const mockUserData = {
    userId: 'user1',
    displayName: 'Test User',
    email: 'user@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetcher.mockReset()
  })

  describe('isTokenValid', () => {
    it('should correctly validate token based on expiration date', () => {
      expect(isTokenValid(null)).toBe(false)
      expect(isTokenValid(expiredTokens)).toBe(false)
      expect(isTokenValid(validTokens)).toBe(true)
    })
  })

  describe('isRefreshTokenValid', () => {
    it('should return false for null tokens', () => {
      expect(isRefreshTokenValid(null)).toBe(false)
    })

    it('should return false for expired refresh tokens', () => {
      expect(isRefreshTokenValid(expiredTokens)).toBe(false)
    })

    it('should return true for valid refresh tokens', () => {
      expect(isRefreshTokenValid(validTokens)).toBe(true)
    })

    it('should validate refresh token independently of access token', () => {
      // Token con refresh válido pero access expirado
      const mixedToken = {
        ...expiredTokens,
        refreshExpiresAt: futureDate.toISOString(),
      }
      expect(isRefreshTokenValid(mixedToken)).toBe(true)
    })
  })

  describe('refreshTokens', () => {
    it('should call API and return new tokens', async () => {
      const mockApiResponse = {
        ok: true,
        data: {
          accessToken: 'new-access-token',
          accessTokenExpiresAt: futureDate.toISOString(),
          refreshToken: 'new-refresh-token',
          refreshTokenExpiresAt: futureDate.toISOString(),
        },
      }

      mockFetcher.mockResolvedValueOnce(mockApiResponse)

      const result = await refreshTokens(mockFetcher, 'old-refresh-token')

      expect(mockFetcher).toHaveBeenCalledWith('POST /v3/auth/refresh', {
        data: { refreshToken: 'old-refresh-token' },
      })

      expect(result).toEqual({
        access: 'new-access-token',
        accessExpiresAt: futureDate.toISOString(),
        refresh: 'new-refresh-token',
        refreshExpiresAt: futureDate.toISOString(),
      })
    })

    it('should throw error when refresh fails', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: false,
        data: { message: 'Invalid refresh token' },
      })

      await expect(refreshTokens(mockFetcher, 'invalid-token')).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('doAppLogin', () => {
    it('should handle the full login flow correctly', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        data: {
          accessToken: 'login-access',
          accessTokenExpiresAt: futureDate.toISOString(),
          refreshToken: 'login-refresh',
          refreshTokenExpiresAt: futureDate.toISOString(),
        },
      })

      mockFetcher.mockResolvedValueOnce({
        ok: true,
        data: mockUserData,
      })

      const credentials = { email: 'user@example.com', password: 'password123' }
      const result = await doAppLogin(mockFetcher, credentials)

      expect(mockFetcher).toHaveBeenCalledTimes(2)

      expect(result).toHaveProperty('tokens')
      expect(result).toHaveProperty('userData')
      expect(result.tokens.access).toBe('login-access')
      expect(result.userData.userId).toBe('user1')
    })

    it('should propagate errors from the login endpoint', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: false,
        data: { message: 'Invalid credentials' },
      })

      const credentials = { email: 'wrong@example.com', password: 'wrong' }
      await expect(doAppLogin(mockFetcher, credentials)).rejects.toThrow('Invalid credentials')

      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUserAndTokensFromInitialTokens', () => {
    it('should handle null tokens', async () => {
      const result = await getUserAndTokensFromInitialTokens(mockFetcher, null)
      expect(result).toEqual({ tokens: null, userData: null })
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('should handle Promise tokens', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        data: mockUserData,
      })

      const tokenPromise = Promise.resolve(validTokens)
      const result = await getUserAndTokensFromInitialTokens(mockFetcher, tokenPromise)

      expect(result.tokens).toEqual(validTokens)
      expect(result.userData).toBeDefined()
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })

    it('should handle direct tokens object', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        data: mockUserData,
      })

      const result = await getUserAndTokensFromInitialTokens(mockFetcher, validTokens)

      expect(result.tokens).toEqual(validTokens)
      expect(result.userData).toBeDefined()
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })

    it('should handle expired tokens without calling user API', async () => {
      const result = await getUserAndTokensFromInitialTokens(mockFetcher, expiredTokens)

      expect(result.tokens).toEqual(expiredTokens)
      expect(result.userData).toBeNull()
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('should handle promise that resolves to null', async () => {
      const tokenPromise = Promise.resolve(null)
      const result = await getUserAndTokensFromInitialTokens(mockFetcher, tokenPromise)

      expect(result).toEqual({ tokens: null, userData: null })
      expect(mockFetcher).not.toHaveBeenCalled()
    })
  })
  describe('getRefreshTimeout', () => {
    it('should throw error for null tokens', () => {
      expect(() => getRefreshTimeout(null)).toThrow('No tokens available')
    })

    it('should return positive time for valid tokens', () => {
      const timeout = getRefreshTimeout(validTokens)
      expect(timeout).toBeGreaterThan(0)
    })

    it('should return negative time for expired tokens', () => {
      const timeout = getRefreshTimeout(expiredTokens)
      expect(timeout).toBeLessThan(0)
    })
  })
})
