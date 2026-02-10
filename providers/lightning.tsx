import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { AspContext } from './asp'
import { WalletContext } from './wallet'
import {
  BoltzSwapProvider,
  FeesResponse,
  ArkadeLightning,
  Network,
  PendingReverseSwap,
  PendingSubmarineSwap,
  setLogger,
  SwapManagerClient,
} from '@arkade-os/boltz-swap'
import { ConfigContext } from './config'
import { consoleError, consoleLog } from '@/lib/logs'
import { sendOffChain } from '@/lib/asp'
import { PendingSwap } from '@/lib/types'

const BASE_URLS: Record<Network, string | null> = {
  bitcoin: 'https://api.ark.boltz.exchange',
  mutinynet: 'https://api.boltz.mutinynet.arkade.sh',
  signet: 'https://boltz.signet.arkade.sh',
  regtest: 'http://localhost:9069',
  testnet: null,
}

interface LightningContextProps {
  connected: boolean
  calcSubmarineSwapFee: (satoshis: number) => number
  calcReverseSwapFee: (satoshis: number) => number
  arkadeLightning: ArkadeLightning | null
  swapManager: SwapManagerClient | null
  toggleConnection: () => void
  createSubmarineSwap: (invoice: string) => Promise<PendingSubmarineSwap | null>
  createReverseSwap: (sats: number) => Promise<PendingReverseSwap | null>
  claimVHTLC: (swap: PendingReverseSwap) => Promise<void>
  refundVHTLC: (swap: PendingSubmarineSwap) => Promise<void>
  payInvoice: (swap: PendingSubmarineSwap) => Promise<{ txid: string; preimage: string }>
  getSwapHistory: () => Promise<PendingSwap[]>
  getFees: () => Promise<FeesResponse | null>
  getApiUrl: () => string | null
  restoreSwaps: () => Promise<number>
}

export const LightningContext = createContext<LightningContextProps>({
  connected: false,
  arkadeLightning: null,
  swapManager: null,
  toggleConnection: () => {},
  calcReverseSwapFee: () => 0,
  calcSubmarineSwapFee: () => 0,
  createSubmarineSwap: async () => null,
  createReverseSwap: async () => null,
  claimVHTLC: async () => {},
  refundVHTLC: async () => {},
  payInvoice: async () => { throw new Error('Lightning not initialized') },
  getSwapHistory: async () => [],
  getFees: async () => null,
  getApiUrl: () => null,
  restoreSwaps: async () => 0,
})

export const LightningProvider = ({ children }: { children: ReactNode }) => {
  const { aspInfo } = useContext(AspContext)
  const { sdkWallet } = useContext(WalletContext)
  const { config, updateConfig, backupConfig } = useContext(ConfigContext)

  const [arkadeLightning, setArkadeLightning] = useState<ArkadeLightning | null>(null)
  const [fees, setFees] = useState<FeesResponse | null>(null)
  const [apiUrl, setApiUrl] = useState<string | null>(null)

  const connected = config.apps.boltz.connected

  useEffect(() => {
    if (!aspInfo.network || !sdkWallet) return

    const baseUrl = BASE_URLS[aspInfo.network as Network]
    if (!baseUrl) return

    setApiUrl(baseUrl)

    const network = aspInfo.network as Network
    const swapProvider = new BoltzSwapProvider({ apiUrl: baseUrl, network })

    const instance = new ArkadeLightning({
      wallet: sdkWallet,
      swapProvider,
      swapManager: config.apps.boltz.connected,
    })

    setArkadeLightning(instance)

    setLogger({
      log: (...args: unknown[]) => consoleLog(...args),
      error: (...args: unknown[]) => consoleError(args[0], args.slice(1).join(' ')),
      warn: (...args: unknown[]) => consoleLog(...args),
    })

    return () => {
      instance.dispose().catch(consoleError)
    }
  }, [aspInfo, sdkWallet, config.apps.boltz.connected])

  useEffect(() => {
    if (!arkadeLightning) return
    arkadeLightning
      .getFees()
      .then(setFees)
      .catch((err) => consoleError(err, 'Failed to fetch fees'))
  }, [arkadeLightning])

  const setConnected = (value: boolean, backup: boolean) => {
    const newConfig = { ...config }
    newConfig.apps.boltz.connected = value
    updateConfig(newConfig)
    if (backup) backupConfig(newConfig)
  }

  const calcSubmarineSwapFee = (satoshis: number): number => {
    if (!satoshis || !fees) return 0
    const { percentage, minerFees } = fees.submarine
    return Math.ceil((satoshis * percentage) / 100 + minerFees)
  }

  const calcReverseSwapFee = (satoshis: number): number => {
    if (!satoshis || !fees) return 0
    const { percentage, minerFees } = fees.reverse
    return Math.ceil((satoshis * percentage) / 100 + minerFees.claim + minerFees.lockup)
  }

  const toggleConnection = () => setConnected(!connected, true)

  const createSubmarineSwap = async (invoice: string): Promise<PendingSubmarineSwap | null> => {
    if (!arkadeLightning) return null
    return arkadeLightning.createSubmarineSwap({ invoice })
  }

  const createReverseSwap = async (sats: number): Promise<PendingReverseSwap | null> => {
    if (!arkadeLightning) return null
    return arkadeLightning.createReverseSwap({ amount: sats, description: 'Lightning Invoice' })
  }

  const claimVHTLC = async (swap: PendingReverseSwap): Promise<void> => {
    if (!arkadeLightning) return
    await arkadeLightning.claimVHTLC(swap)
  }

  const refundVHTLC = async (swap: PendingSubmarineSwap): Promise<void> => {
    if (!arkadeLightning) return
    await arkadeLightning.refundVHTLC(swap)
  }

  const payInvoice = async (pendingSwap: PendingSubmarineSwap): Promise<{ txid: string; preimage: string }> => {
    if (!arkadeLightning || !sdkWallet) throw new Error('Lightning not initialized')
    if (!pendingSwap?.response?.address) throw new Error('No swap address found')
    if (!pendingSwap?.response?.expectedAmount) throw new Error('No swap amount found')

    const satoshis = pendingSwap.response.expectedAmount
    const swapAddress = pendingSwap.response.address

    const txid = await sendOffChain(sdkWallet, satoshis, swapAddress)
    if (!txid) throw new Error('Failed to send offchain payment')

    try {
      const { preimage } = await arkadeLightning.waitForSwapSettlement(pendingSwap)
      return { txid, preimage }
    } catch (e: unknown) {
      consoleError(e, 'Swap failed')
      throw new Error('Swap failed')
    }
  }

  const getSwapHistory = async (): Promise<PendingSwap[]> => {
    if (!arkadeLightning) return []
    return arkadeLightning.getSwapHistory()
  }

  const getFees = async (): Promise<FeesResponse | null> => {
    if (!arkadeLightning) return null
    return arkadeLightning.getFees()
  }

  const getApiUrl = (): string | null => apiUrl

  const restoreSwaps = async (): Promise<number> => {
    if (!arkadeLightning) return 0
    let counter = 0
    let reverseSwaps: PendingReverseSwap[] = []
    let submarineSwaps: PendingSubmarineSwap[] = []
    try {
      const result = await arkadeLightning.restoreSwaps()
      reverseSwaps = result.reverseSwaps
      submarineSwaps = result.submarineSwaps
    } catch (err) {
      consoleError(err, 'Error restoring swaps from Boltz')
      return 0
    }
    if (reverseSwaps.length === 0 && submarineSwaps.length === 0) return 0

    const history = await arkadeLightning.getSwapHistory()
    const historyIds = new Set(history.map((s) => s.response.id))

    for (const swap of reverseSwaps) {
      if (!historyIds.has(swap.response.id)) {
        try {
          await arkadeLightning.swapRepository.saveSwap(swap)
          counter++
        } catch (err) {
          consoleError(err, `Failed to save reverse swap ${swap.response.id}`)
        }
      }
    }

    for (const swap of submarineSwaps) {
      if (!historyIds.has(swap.response.id)) {
        try {
          await arkadeLightning.swapRepository.saveSwap(swap)
          counter++
        } catch (err) {
          consoleError(err, `Failed to save submarine swap ${swap.response.id}`)
        }
      }
    }

    return counter
  }

  const swapManager = arkadeLightning?.getSwapManager?.() ?? null

  return (
    <LightningContext.Provider
      value={{
        connected, arkadeLightning, swapManager, toggleConnection,
        calcReverseSwapFee, calcSubmarineSwapFee,
        createSubmarineSwap, createReverseSwap, claimVHTLC, refundVHTLC, payInvoice,
        getSwapHistory, getFees, getApiUrl, restoreSwaps,
      }}
    >
      {children}
    </LightningContext.Provider>
  )
}
