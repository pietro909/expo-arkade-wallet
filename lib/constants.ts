export const arknoteHRP = 'arknote'
export const defaultFee = 0
export const defaultPassword = 'noah'
export const minSatsToNudge = 100_000
export const maxPercentage = 10

const devServer = process.env.EXPO_PUBLIC_ARK_DEV_SERVER ?? 'http://localhost:7070'
const testServer = process.env.EXPO_PUBLIC_ARK_TEST_SERVER ?? 'https://arkade.computer'
const mainServer = process.env.EXPO_PUBLIC_ARK_MAIN_SERVER ?? 'https://arkade.computer'

export const defaultArkServer = (): string => {
  return devServer
}

export { devServer, testServer, mainServer }
