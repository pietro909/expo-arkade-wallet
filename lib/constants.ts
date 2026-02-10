import Constants from 'expo-constants'

export const arknoteHRP = 'arknote'
export const defaultFee = 0
export const defaultPassword = 'noah'
export const minSatsToNudge = 100_000
export const maxPercentage = 10

const devServer = 'http://192.168.0.115:7070'
const testServer = 'https://arkade.computer'
const mainServer = 'https://arkade.computer'

export const defaultArkServer = (): string => {
  const envServer = Constants.expoConfig?.extra?.arkServer
  if (envServer) return envServer
  return devServer
}

export { devServer, testServer, mainServer }
