import { ReactNode, createContext, useState } from 'react'
import { SettingsOptions, SettingsSections } from '@/lib/types'

export interface Option {
  label: string
  option: SettingsOptions
  section: SettingsSections
}

export const options: Option[] = [
  { label: 'About', option: SettingsOptions.About, section: SettingsSections.General },
  { label: 'Advanced', option: SettingsOptions.Advanced, section: SettingsSections.Security },
  { label: 'Backup', option: SettingsOptions.Backup, section: SettingsSections.Security },
  { label: 'General', option: SettingsOptions.General, section: SettingsSections.General },
  { label: 'Lock', option: SettingsOptions.Lock, section: SettingsSections.Security },
  { label: 'Logs', option: SettingsOptions.Logs, section: SettingsSections.Advanced },
  { label: 'Notes', option: SettingsOptions.Notes, section: SettingsSections.General },
  { label: 'Notifications', option: SettingsOptions.Notifications, section: SettingsSections.General },
  { label: 'Reset', option: SettingsOptions.Reset, section: SettingsSections.Security },
  { label: 'Server', option: SettingsOptions.Server, section: SettingsSections.Advanced },
  { label: 'Support', option: SettingsOptions.Support, section: SettingsSections.General },
  { label: 'Coin Control', option: SettingsOptions.Vtxos, section: SettingsSections.Advanced },
  { label: 'Theme', option: SettingsOptions.Theme, section: SettingsSections.Config },
  { label: 'Fiat Currency', option: SettingsOptions.Fiat, section: SettingsSections.Config },
  { label: 'Display', option: SettingsOptions.Display, section: SettingsSections.Config },
  { label: 'Password', option: SettingsOptions.Password, section: SettingsSections.Advanced },
]

export interface SectionResponse {
  section: SettingsSections
  options: Option[]
}

const allOptions: SectionResponse[] = [SettingsSections.General, SettingsSections.Security].map((section) => ({
  section,
  options: options.filter((o) => o.section === section),
}))

interface OptionsContextProps {
  option: SettingsOptions
  options: Option[]
  goBack: () => void
  setOption: (o: SettingsOptions) => void
  validOptions: () => SectionResponse[]
}

export const OptionsContext = createContext<OptionsContextProps>({
  option: SettingsOptions.Menu,
  options: [],
  goBack: () => {},
  setOption: () => {},
  validOptions: () => [],
})

export const OptionsProvider = ({ children }: { children: ReactNode }) => {
  const [option, setOption] = useState(SettingsOptions.Menu)

  const optionSection = (opt: SettingsOptions): SettingsSections => {
    return options.find((o) => o.option === opt)?.section || SettingsSections.General
  }

  const goBack = () => {
    const section = optionSection(option)
    setOption(
      section === SettingsSections.Advanced
        ? SettingsOptions.Advanced
        : section === SettingsSections.Config
          ? SettingsOptions.General
          : SettingsOptions.Menu,
    )
  }

  const validOptions = (): SectionResponse[] => allOptions

  return (
    <OptionsContext.Provider value={{ option, options, goBack, setOption, validOptions }}>
      {children}
    </OptionsContext.Provider>
  )
}
