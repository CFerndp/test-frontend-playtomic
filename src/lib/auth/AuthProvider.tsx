import { createContext, ReactNode, useEffect, useState } from 'react'
import { Auth, AuthInitializeConfig } from './types'
import { doAppLogin, getUser, isTokenValid } from './authService'
import { useApiFetcher } from '../api'

interface AuthProviderProps extends AuthInitializeConfig {
  children?: ReactNode

  /**
   * @see {@link AuthInitializeConfig.initialTokens}
   */
  initialTokens?: AuthInitializeConfig['initialTokens']

  /**
   * @see {@link AuthInitializeConfig.onAuthChange}
   */
  onAuthChange?: AuthInitializeConfig['onAuthChange']
}

const AuthContext = createContext<Auth | null>(null)

/**
 * Initializes the auth state and exposes it to the component-tree below.
 *
 * This allow separate calls of `useAuth` to communicate among each-other and share
 * a single source of truth.
 */
function AuthProvider(props: AuthProviderProps): JSX.Element {
  const { initialTokens, onAuthChange, children } = props

  const [currentUser, setCurrentUser] = useState<Auth['currentUser'] | null | undefined>(undefined)
  const [tokens, setTokens] = useState<Auth['tokens'] | null | undefined>(undefined)

  const fetcher = useApiFetcher()

  const login: Auth['login'] = async credentials => {
    const loginResponse = await doAppLogin(fetcher, credentials)

    const { tokens, userData } = loginResponse

    setCurrentUser({
      userId: userData.userId,
      name: userData.displayName,
      email: userData.email ?? credentials.email,
    })
    setTokens({
      access: tokens.accessToken,
      accessExpiresAt: tokens.accessTokenExpiresAt,
      refresh: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshTokenExpiresAt,
    })
  }

  const logout: Auth['logout'] = async () => {
    if (!currentUser) {
      throw new Error('No user logged in')
    }

    setCurrentUser(null)
    setTokens(null)

    return Promise.resolve()
  }

  useEffect(() => {
    if (!tokens) {
      return
    }

    onAuthChange?.(tokens)
  }, [tokens, onAuthChange])

  useEffect(() => {
    const asyncTask = async () => {
      if (!initialTokens) {
        return
      }

      let tokens: Auth['tokens'] | null = null

      if (initialTokens instanceof Promise) {
        const tokenResponse = await initialTokens

        if (!tokenResponse) {
          return
        }

        tokens = tokenResponse
      }

      if (!tokens || !isTokenValid(tokens)) {
        return
      }

      const userData = await getUser(fetcher, tokens.access)

      setCurrentUser({
        userId: userData.userId,
        name: userData.displayName,
        email: userData.email ?? '',
      })
      setTokens(tokens)
    }

    void asyncTask()

    // Hook check disabled in order to suscribe to onMount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        tokens,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider, type AuthProviderProps, AuthContext }
