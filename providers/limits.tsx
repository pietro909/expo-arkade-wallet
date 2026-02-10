import { ReactNode, createContext, useContext, useEffect, useRef } from 'react'
import { Satoshis, TxType } from '@/lib/types'
import { AspContext } from './asp'
import { consoleError } from '@/lib/logs'
import { WalletContext } from './wallet'
import { LightningContext } from './lightning'

type LimitsContextProps = {
  amountIsAboveMaxLimit: (sats: Satoshis) => boolean
  amountIsBelowMinLimit: (sats: Satoshis) => boolean
  validLnSwap: (sats: Satoshis) => boolean
  validUtxoTx: (sats: Satoshis) => boolean
  validVtxoTx: (sats: Satoshis) => boolean
  lnSwapsAllowed: () => boolean
  utxoTxsAllowed: () => boolean
  vtxoTxsAllowed: () => boolean
  minSwapAllowed: () => number
  maxSwapAllowed: () => number
}

type LimitAmounts = { min: bigint; max: bigint }
type LimitTxTypes = Record<TxType, LimitAmounts>

export const LimitsContext = createContext<LimitsContextProps>({
  amountIsAboveMaxLimit: () => false,
  amountIsBelowMinLimit: () => false,
  lnSwapsAllowed: () => false,
  utxoTxsAllowed: () => false,
  vtxoTxsAllowed: () => false,
  validLnSwap: () => false,
  validUtxoTx: () => false,
  validVtxoTx: () => false,
  minSwapAllowed: () => 0,
  maxSwapAllowed: () => 0,
})

export const LimitsProvider = ({ children }: { children: ReactNode }) => {
  const { aspInfo } = useContext(AspContext)
  const { sdkWallet } = useContext(WalletContext)
  const { arkadeLightning, connected } = useContext(LightningContext)

  const limits = useRef<LimitTxTypes>({
    swap: { min: BigInt(0), max: BigInt(0) },
    utxo: { min: BigInt(0), max: BigInt(-1) },
    vtxo: { min: BigInt(0), max: BigInt(-1) },
  })

  useEffect(() => {
    if (!aspInfo.network || !sdkWallet || !arkadeLightning) return

    limits.current.utxo = {
      min: BigInt(aspInfo.utxoMinAmount || aspInfo.dust || -1),
      max: BigInt(aspInfo.utxoMaxAmount || -1),
    }

    limits.current.vtxo = {
      min: BigInt(aspInfo.vtxoMinAmount || aspInfo.dust || -1),
      max: BigInt(aspInfo.vtxoMaxAmount || -1),
    }
  }, [aspInfo.network, sdkWallet, arkadeLightning])

  useEffect(() => {
    if (!arkadeLightning) return
    if (connected) {
      arkadeLightning
        .getLimits()
        .then((res) => {
          if (!res) return
          limits.current.swap = {
            ...limits.current.swap,
            min: BigInt(res.min),
            max: BigInt(res.max),
          }
        })
        .catch((e) => consoleError(e))
    } else {
      limits.current.swap = { ...limits.current.swap, min: BigInt(0), max: BigInt(0) }
    }
  }, [arkadeLightning, connected])

  const minSwapAllowed = () => Number(limits.current.swap.min)
  const maxSwapAllowed = () => Number(limits.current.swap.max)

  const validAmount = (sats: Satoshis, txtype: TxType): boolean => {
    if (!sats) return txtype !== TxType.swap
    const bigSats = BigInt(sats)
    const { min, max } = limits.current[txtype]
    return bigSats >= min && (max === BigInt(-1) || bigSats <= max)
  }

  const validLnSwap = (sats: Satoshis): boolean => validAmount(sats, TxType.swap)
  const validUtxoTx = (sats: Satoshis): boolean => validAmount(sats, TxType.utxo)
  const validVtxoTx = (sats: Satoshis): boolean => validAmount(sats, TxType.vtxo)

  const getMaxSatsAllowed = (): bigint => {
    const { utxo, vtxo } = limits.current
    if (vtxo.max === BigInt(-1)) return utxo.max > 0 ? utxo.max : BigInt(-1)
    if (vtxo.max === BigInt(0)) return utxo.max
    if (utxo.max <= BigInt(0)) return vtxo.max
    return utxo.max < vtxo.max ? utxo.max : vtxo.max
  }

  const getMinSatsAllowed = (): bigint => {
    const { utxo, vtxo } = limits.current
    return utxo.min < vtxo.min ? utxo.min : vtxo.min
  }

  const amountIsAboveMaxLimit = (sats: Satoshis): boolean => {
    const maxAllowed = getMaxSatsAllowed()
    return maxAllowed === BigInt(-1) ? false : BigInt(sats) > maxAllowed
  }

  const amountIsBelowMinLimit = (sats: Satoshis) => {
    return getMinSatsAllowed() < 0 ? false : BigInt(sats) < getMinSatsAllowed()
  }

  const lnSwapsAllowed = () => limits.current.swap.max !== BigInt(0)
  const utxoTxsAllowed = () => limits.current.utxo.max !== BigInt(0)
  const vtxoTxsAllowed = () => limits.current.vtxo.max !== BigInt(0)

  return (
    <LimitsContext.Provider
      value={{
        amountIsAboveMaxLimit, amountIsBelowMinLimit,
        minSwapAllowed, maxSwapAllowed,
        lnSwapsAllowed, utxoTxsAllowed, vtxoTxsAllowed,
        validLnSwap, validUtxoTx, validVtxoTx,
      }}
    >
      {children}
    </LimitsContext.Provider>
  )
}
