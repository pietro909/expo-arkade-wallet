import * as SecureStore from 'expo-secure-store'
import { defaultPassword } from './constants'

const STORAGE_KEY = 'private_key'

export const invalidPrivateKey = (key: Uint8Array): string => {
  if (key.length === 0) return ''
  if (key.length !== 32) return 'Invalid length: private key must be 32 bytes'
  return ''
}

export const getPrivateKey = async (password: string): Promise<Uint8Array> => {
  const stored = await SecureStore.getItemAsync(`${STORAGE_KEY}_${password}`)
  if (!stored) throw new Error('No private key found for this password')
  return new Uint8Array(JSON.parse(stored))
}

export const setPrivateKey = async (privateKey: Uint8Array, password: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      `${STORAGE_KEY}_${password}`,
      JSON.stringify(Array.from(privateKey)),
    )
  } catch (error) {
    console.error('Failed to store private key:', error)
    throw new Error('Failed to set private key')
  }
}

export const isValidPassword = async (password: string): Promise<boolean> => {
  try {
    await getPrivateKey(password)
    return true
  } catch {
    return false
  }
}

export const noUserDefinedPassword = async (): Promise<boolean> => {
  return await isValidPassword(defaultPassword)
}

export const deletePrivateKey = async (password: string): Promise<void> => {
  await SecureStore.deleteItemAsync(`${STORAGE_KEY}_${password}`)
}
