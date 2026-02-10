import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { ConfigContext } from './config'

interface AnnouncementItem {
  id: string
  message: string
  inactive?: boolean
}

const announcements: AnnouncementItem[] = [
  { id: 'boltz', message: 'Boltz swaps are now available!', inactive: true },
  { id: 'nostr backups', message: 'Enable Nostr backups to keep your wallet safe' },
]

interface AnnouncementContextProps {
  announcement: string | null
  dismissAnnouncement: () => void
}

export const AnnouncementContext = createContext<AnnouncementContextProps>({
  announcement: null,
  dismissAnnouncement: () => {},
})

export const AnnouncementProvider = ({ children }: { children: ReactNode }) => {
  const { config, updateConfig } = useContext(ConfigContext)

  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [currentId, setCurrentId] = useState<string | null>(null)

  const seen = useRef(false)

  useEffect(() => {
    if (!config || !config.pubkey || seen.current || !Array.isArray(config.announcementsSeen)) return
    const activeAnnouncements = announcements.filter((a) => !a.inactive)
    for (const item of activeAnnouncements) {
      if (!config.announcementsSeen.includes(item.id)) {
        setAnnouncement(item.message)
        setCurrentId(item.id)
        return
      }
    }
  }, [config])

  const dismissAnnouncement = () => {
    if (currentId) {
      const announcementsSeen = [...config.announcementsSeen, currentId]
      updateConfig({ ...config, announcementsSeen })
    }
    setAnnouncement(null)
    seen.current = true
  }

  return (
    <AnnouncementContext.Provider value={{ announcement, dismissAnnouncement }}>
      {children}
    </AnnouncementContext.Provider>
  )
}
