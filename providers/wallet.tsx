import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { readWalletFromStorage, saveWalletToStorage } from '@/lib/storage'
import { getRestApiExplorerURL } from '@/lib/explorers'
import { getBalance, getTxHistory, getVtxos, renewCoins, settleVtxos } from '@/lib/asp'
import { AspContext } from './asp'
import { NotificationsContext } from './notifications'
import { FlowContext } from './flow'
import { consoleError } from '@/lib/logs'
import { Tx, Vtxo, Wallet } from '@/lib/types'
import { calcBatchLifetimeMs, calcNextRollover } from '@/lib/wallet'
import { IWallet, NetworkName, SingleKey, Wallet as SdkWallet } from '@arkade-os/sdk'
import { ExpoArkProvider, ExpoIndexerProvider } from '@arkade-os/sdk/adapters/expo'
import { hex } from '@scure/base'
import * as secp from '@noble/secp256k1'
import { ConfigContext } from './config'
import { maxPercentage } from '@/lib/constants'
import { Indexer } from '@/lib/indexer'

const defaultWallet: Wallet = {
  network: '',
  nextRollover: 0,
}

interface WalletContextProps {
  initWallet: (seed: Uint8Array) => Promise<void>
  lockWallet: () => Promise<void>
  resetWallet: () => Promise<void>
  settlePreconfirmed: () => Promise<void>
  updateWallet: (w: Wallet | ((prev: Wallet) => Wallet)) => void
  isLocked: () => boolean
  reloadWallet: (w?: IWallet) => Promise<void>
  wallet: Wallet
  walletLoaded: boolean
  sdkWallet: IWallet | undefined
  txs: Tx[]
  vtxos: { spendable: Vtxo[]; spent: Vtxo[] }
  balance: number
  initialized: boolean
}

export const WalletContext = createContext<WalletContextProps>({
  initWallet: () => Promise.resolve(),
  lockWallet: () => Promise.resolve(),
  resetWallet: () => Promise.resolve(),
  settlePreconfirmed: () => Promise.resolve(),
  updateWallet: () => {},
  reloadWallet: () => Promise.resolve(),
  wallet: defaultWallet,
  walletLoaded: false,
  sdkWallet: undefined,
  isLocked: () => true,
  balance: 0,
  txs: [],
  vtxos: { spendable: [], spent: [] },
  initialized: false,
})

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { aspInfo } = useContext(AspContext)
  const { config, updateConfig } = useContext(ConfigContext)
  const { noteInfo } = useContext(FlowContext)
  const { notifyTxSettled } = useContext(NotificationsContext)

  const [txs, setTxs] = useState<Tx[]>([])
  const [balance, setBalance] = useState(0)
  const [wallet, setWallet] = useState(defaultWallet)
  const [walletLoaded, setWalletLoaded] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [sdkWallet, setSdkWallet] = useState<IWallet>()
  const [vtxos, setVtxos] = useState<{ spendable: Vtxo[]; spent: Vtxo[] }>({ spendable: [], spent: [] })

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // read wallet from storage on mount
  useEffect(() => {
    readWalletFromStorage().then((walletFromStorage) => {
      if (walletFromStorage) setWallet(walletFromStorage)
      setWalletLoaded(true)
    })
  }, [])

  // reload wallet when SDK wallet becomes available
  useEffect(() => {
    if (sdkWallet) reloadWallet().catch(consoleError)
  }, [sdkWallet])

  // calculate thresholdMs and next rollover
  useEffect(() => {
    if (!initialized || !vtxos || !sdkWallet) return
    const computeThresholds = async () => {
      try {
        const allVtxos = await sdkWallet.getVtxos()
        const batchLifetimeMs = await calcBatchLifetimeMs(allVtxos, new Indexer(aspInfo))
        const thresholdMs = Math.floor((batchLifetimeMs * maxPercentage) / 100)
        const nextRollover = await calcNextRollover(vtxos.spendable, sdkWallet, aspInfo)
        updateWallet((prev) => ({ ...prev, nextRollover, thresholdMs }))
      } catch (err) {
        consoleError(err, 'Error computing rollover thresholds')
      }
    }
    computeThresholds()
  }, [initialized, vtxos, sdkWallet, aspInfo])

  // poll for balance updates (replaces service worker messages)
  useEffect(() => {
    if (!initialized || !sdkWallet) return
    pollingRef.current = setInterval(() => {
      reloadWallet().catch(consoleError)
    }, 10_000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [initialized, sdkWallet])

  const reloadWallet = async (w = sdkWallet) => {
    if (!w) return
    try {
      const vtxos = await getVtxos(w)
      const txs = await getTxHistory(w)
      const balance = await getBalance(w)
      setBalance(balance)
      setVtxos(vtxos)
      setTxs(txs)
    } catch (err) {
      consoleError(err, 'Error reloading wallet')
    }
  }

  const initWallet = async (privateKey: Uint8Array) => {
    const arkServerUrl = aspInfo.url
    const network = aspInfo.network as NetworkName
    const esploraUrl = getRestApiExplorerURL(network) ?? ''
    const pubkey = hex.encode(secp.getPublicKey(privateKey))
    updateConfig({ ...config, pubkey })

    const identity = SingleKey.fromHex(hex.encode(privateKey))
    const w = await SdkWallet.create({
      identity,
      arkProvider: new ExpoArkProvider(arkServerUrl),
      indexerProvider: new ExpoIndexerProvider(arkServerUrl),
      esploraUrl,
    })

    setSdkWallet(w)
    updateWallet({ ...wallet, network, pubkey })
    setInitialized(true)

    // renew expiring coins on startup
    renewCoins(w, aspInfo.dust, wallet.thresholdMs).catch(() => {})
  }

  const lockWallet = async () => {
    setSdkWallet(undefined)
    setInitialized(false)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  const resetWallet = async () => {
    await lockWallet()
    const { clearStorage } = await import('@/lib/storage')
    await clearStorage()
  }

  const settlePreconfirmed = async () => {
    if (!sdkWallet) throw new Error('Wallet not initialized')
    await settleVtxos(sdkWallet, aspInfo.dust, wallet.thresholdMs)
    notifyTxSettled()
  }

  const updateWallet = (data: Wallet | ((prev: Wallet) => Wallet)) => {
    setWallet((prev) => {
      const next = typeof data === 'function' ? (data as (prev: Wallet) => Wallet)(prev) : data
      saveWalletToStorage(next).catch(consoleError)
      return { ...next }
    })
  }

  const isLocked = () => !initialized

  return (
    <WalletContext.Provider
      value={{
        initWallet,
        isLocked,
        initialized,
        resetWallet,
        settlePreconfirmed,
        updateWallet,
        wallet,
        walletLoaded,
        sdkWallet,
        lockWallet,
        txs,
        balance,
        reloadWallet,
        vtxos: vtxos ?? { spendable: [], spent: [] },
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
