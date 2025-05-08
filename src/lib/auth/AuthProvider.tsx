import { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { Auth, AuthInitializeConfig } from './types'
import {
  doAppLogin,
  getRefreshTimeout,
  getUserAndTokensFromInitialTokens,
  isRefreshTokenValid,
  refreshTokens,
} from './authService'
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
    const { tokens, userData } = await doAppLogin(fetcher, credentials)

    setCurrentUser(userData)
    setTokens(tokens)
  }

  const logout: Auth['logout'] = async () => {
    if (!currentUser) {
      throw new Error('No user logged in')
    }

    setCurrentUser(null)
    setTokens(null)

    return Promise.resolve()
  }

  const refresh = useCallback(async () => {
    if (!tokens) {
      throw new Error('No tokens available')
    }

    if (!isRefreshTokenValid(tokens)) {
      throw new Error('Refresh token expired')
    }

    const newTokens = await refreshTokens(fetcher, tokens.refresh)

    // we set new tokens, callback will be called in the effect
    setTokens(newTokens)

    return Promise.resolve()
  }, [fetcher, tokens])

  useEffect(() => {
    if (!tokens) {
      return
    }

    const refreshTimeout = getRefreshTimeout(tokens)

    const timeout = setTimeout(() => {
      void refresh()
    }, refreshTimeout)

    return () => {
      clearTimeout(timeout)
    }
  }, [tokens, refresh])

  // This effect will be dispatched every time tokens changes, therefore, it will send the change via onAuthChange callback
  useEffect(() => {
    if (tokens === undefined) {
      return
    }

    onAuthChange?.(tokens)
  }, [tokens, onAuthChange])

  useEffect(() => {
    const asyncTask = async () => {
      const { tokens, userData } = await getUserAndTokensFromInitialTokens(fetcher, initialTokens)

      setCurrentUser(userData)
      setTokens(tokens)
    }

    void asyncTask()

    // Hook check disabled in order to suscribe to first render
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
