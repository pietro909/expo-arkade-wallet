import { ReactNode, createContext, useContext } from 'react'
import { ConfigContext } from './config'
import { prettyNumber } from '@/lib/format'

interface NotificationsContextProps {
  notifyPaymentReceived: (s: number) => void
  notifyPaymentSent: (s: number) => void
  notifyVtxosRollover: () => void
  notifyTxSettled: () => void
}

export const NotificationsContext = createContext<NotificationsContextProps>({
  notifyPaymentReceived: () => {},
  notifyPaymentSent: () => {},
  notifyVtxosRollover: () => {},
  notifyTxSettled: () => {},
})

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { config } = useContext(ConfigContext)

  const sendSystemNotification = (title: string, body: string) => {
    if (!config.notifications) return
    // TODO: Implement with expo-notifications
    console.log(`[Notification] ${title}: ${body}`)
  }

  const notifyPaymentReceived = (sats: number) => {
    sendSystemNotification('Payment received', `You received ${prettyNumber(sats)} sats`)
  }

  const notifyPaymentSent = (sats: number) => {
    sendSystemNotification('Payment sent', `You sent ${prettyNumber(sats)} sats`)
  }

  const notifyTxSettled = () => {
    sendSystemNotification('Transactions settled', 'All preconfirmed transactions were settled')
  }

  const notifyVtxosRollover = () => {
    sendSystemNotification('Vtxos rolled over', 'All VTXOs were rolled over')
  }

  return (
    <NotificationsContext.Provider
      value={{ notifyPaymentReceived, notifyPaymentSent, notifyVtxosRollover, notifyTxSettled }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
