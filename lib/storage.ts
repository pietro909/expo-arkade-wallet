import AsyncStorage from '@react-native-async-storage/async-storage'
import { Config, Wallet } from './types'

export async function clearStorage(): Promise<void> {
  const config = await readConfigFromStorage()
  await AsyncStorage.clear()
  if (config) await saveConfigToStorage(config)
}

export const saveConfigToStorage = async (config: Config): Promise<void> => {
  await AsyncStorage.setItem('config', JSON.stringify(config))
}

export const readConfigFromStorage = async (): Promise<Config | undefined> => {
  try {
    const item = await AsyncStorage.getItem('config')
    return item ? JSON.parse(item) : undefined
  } catch {
    return undefined
  }
}

export const saveWalletToStorage = async (wallet: Wallet): Promise<void> => {
  await AsyncStorage.setItem('wallet', JSON.stringify(wallet))
}

export const readWalletFromStorage = async (): Promise<Wallet | undefined> => {
  try {
    const item = await AsyncStorage.getItem('wallet')
    return item ? JSON.parse(item) : undefined
  } catch {
    return undefined
  }
}
