'use client'

import { ReactNode } from 'react'
import * as Auth0Client from '@auth0/nextjs-auth0/client'
import { PayPalProvider } from '@/components/PayPalProvider'

export function Providers({ children }: { children: ReactNode }) {
  const { UserProvider } = Auth0Client as unknown as {
    UserProvider: React.ComponentType<{ children: ReactNode }>
  }
  
  return (
    <UserProvider>
      <PayPalProvider>
        {children}
      </PayPalProvider>
    </UserProvider>
  )
}
