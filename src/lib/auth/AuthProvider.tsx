import { createContext, ReactNode, useEffect, useState } from 'react'
import { Auth, AuthInitializeConfig } from './types'
import { doAppLogin, getUserFromInitialTokens } from './authService'
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

  useEffect(() => {
    if (tokens === undefined) {
      return
    }

    onAuthChange?.(tokens)
  }, [tokens, onAuthChange])

  useEffect(() => {
    const asyncTask = async () => {
      const { tokens, userData } = await getUserFromInitialTokens(fetcher, initialTokens)

      setCurrentUser(userData)
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
