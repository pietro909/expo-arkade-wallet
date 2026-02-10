import { RestIndexerProvider } from '@arkade-os/sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AspInfo } from '@/providers/asp'

const STORAGE_KEY = 'commitmentTxs'

export class Indexer {
  readonly provider: RestIndexerProvider

  constructor(aspInfo: AspInfo) {
    this.provider = new RestIndexerProvider(aspInfo.url)
  }

  getAndUpdateCommitmentTxCreatedAt = async (txid: string): Promise<number | null> => {
    const createdAt = await this.getCommitmentTxIds(txid)
    if (createdAt) return createdAt
    const commitmentTx = await this.provider.getCommitmentTx(txid)
    if (!commitmentTx?.endedAt) return null
    const newCreatedAt = Number(commitmentTx.endedAt)
    await this.setCommitmentTxIds(txid, newCreatedAt)
    return newCreatedAt
  }

  private async getCommitmentTxIds(txid: string): Promise<number | null> {
    const blob = await AsyncStorage.getItem(STORAGE_KEY)
    const map = blob ? JSON.parse(blob) : {}
    return map[txid] ?? null
  }

  private async setCommitmentTxIds(txid: string, createdAt: number) {
    const blob = await AsyncStorage.getItem(STORAGE_KEY)
    const map = blob ? JSON.parse(blob) : {}
    map[txid] = createdAt
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }
}
