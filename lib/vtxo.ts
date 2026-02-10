import { ExtendedVirtualCoin, IWallet, VtxoManager } from '@arkade-os/sdk'
import { getVtxos } from './asp'

const getOrphanVtxos = async (wallet: IWallet): Promise<ExtendedVirtualCoin[]> => {
  const now = Date.now()
  const { spendable } = await getVtxos(wallet)
  const orphanVtxos = spendable.filter((vtxo) => {
    if (!vtxo.virtualStatus.batchExpiry) return false
    const unspent = vtxo.isSpent === false
    const expired = vtxo.virtualStatus.batchExpiry < now
    const notSwept = vtxo.virtualStatus.state !== 'swept'
    return expired && unspent && notSwept
  })
  return orphanVtxos
}

export const getExpiringAndRecoverableVtxos = async (
  wallet: IWallet,
  thresholdMs: number,
): Promise<ExtendedVirtualCoin[]> => {
  const manager = new VtxoManager(wallet, { thresholdMs })
  return [...(await manager.getExpiringVtxos()), ...(await getOrphanVtxos(wallet))]
}
