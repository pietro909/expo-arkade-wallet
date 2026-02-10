import { ReactNode, createContext, useEffect, useState } from 'react'
import { Appearance } from 'react-native'
import { readConfigFromStorage, saveConfigToStorage, clearStorage } from '@/lib/storage'
import { defaultArkServer } from '@/lib/constants'
import { Config, CurrencyDisplay, Fiats, Themes, Unit } from '@/lib/types'
import { consoleError } from '@/lib/logs'

const defaultConfig: Config = {
  announcementsSeen: [],
  apps: { boltz: { connected: true } },
  aspUrl: defaultArkServer(),
  currencyDisplay: CurrencyDisplay.Both,
  fiat: Fiats.USD,
  nostrBackup: false,
  notifications: false,
  pubkey: '',
  showBalance: true,
  theme: Themes.Dark,
  unit: Unit.BTC,
}

interface ConfigContextProps {
  backupConfig: (c: Config) => Promise<void>
  config: Config
  configLoaded: boolean
  resetConfig: () => void
  setConfig: (c: Config) => void
  showConfig: boolean
  toggleShowConfig: () => void
  updateConfig: (c: Config) => void
  useFiat: boolean
}

export const ConfigContext = createContext<ConfigContextProps>({
  backupConfig: async () => {},
  config: defaultConfig,
  configLoaded: false,
  resetConfig: () => {},
  setConfig: () => {},
  showConfig: false,
  toggleShowConfig: () => {},
  updateConfig: () => {},
  useFiat: false,
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const backupConfig = async (_config: Config) => {
    // TODO: Implement Nostr backup
  }

  const toggleShowConfig = () => setShowConfig(!showConfig)

  const preferredTheme = () =>
    Appearance.getColorScheme() === 'dark' ? Themes.Dark : Themes.Light

  const updateConfig = async (newConfig: Config) => {
    // add protocol to aspUrl if missing
    if (!newConfig.aspUrl.startsWith('http://') && !newConfig.aspUrl.startsWith('https://')) {
      const protocol = newConfig.aspUrl.startsWith('localhost') ? 'http://' : 'https://'
      newConfig = { ...newConfig, aspUrl: protocol + newConfig.aspUrl }
    }
    setConfig(newConfig)
    await saveConfigToStorage(newConfig).catch((e) => consoleError(e, 'Failed to save config'))
  }

  const resetConfig = async () => {
    await clearStorage()
    await updateConfig(defaultConfig)
  }

  useEffect(() => {
    if (configLoaded) return
    readConfigFromStorage().then((stored) => {
      const cfg = stored ? { ...defaultConfig, ...stored } : { ...defaultConfig, theme: preferredTheme() }
      setConfig(cfg)
      saveConfigToStorage(cfg).catch((e) => consoleError(e, 'Failed to save config'))
      setConfigLoaded(true)
    })
  }, [configLoaded])

  const useFiat = config.currencyDisplay === CurrencyDisplay.Fiat

  return (
    <ConfigContext.Provider
      value={{
        backupConfig,
        config,
        configLoaded,
        resetConfig,
        setConfig,
        showConfig,
        toggleShowConfig,
        updateConfig,
        useFiat,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
