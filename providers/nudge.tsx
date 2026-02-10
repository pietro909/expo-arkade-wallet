import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { WalletContext } from './wallet'
import { noUserDefinedPassword } from '@/lib/privateKey'
import { minSatsToNudge } from '@/lib/constants'

type NudgeContextProps = {
  nudge: string | null
  dismissNudge: () => void
}

export const NudgeContext = createContext<NudgeContextProps>({
  nudge: null,
  dismissNudge: () => {},
})

export const NudgeProvider = ({ children }: { children: ReactNode }) => {
  const { balance, wallet } = useContext(WalletContext)

  const [dismissed, setDismissed] = useState(false)
  const [nudge, setNudge] = useState<string | null>(null)

  const dismissNudge = () => {
    setDismissed(true)
    setNudge(null)
  }

  useEffect(() => {
    if (!wallet || !balance || dismissed) return
    noUserDefinedPassword().then((noPassword) => {
      if (noPassword && balance > minSatsToNudge) {
        setNudge('Set a password to protect your wallet')
      }
    })
  }, [wallet, balance, dismissed])

  return <NudgeContext.Provider value={{ nudge, dismissNudge }}>{children}</NudgeContext.Provider>
}
