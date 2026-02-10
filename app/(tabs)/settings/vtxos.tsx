import { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WalletContext } from '@/providers/wallet'
import { AspContext } from '@/providers/asp'
import { ConfigContext } from '@/providers/config'
import { renewCoins } from '@/lib/asp'
import { prettyNumber, prettyHide, prettyDelta } from '@/lib/format'
import { Vtxo } from '@/lib/types'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function VtxoScreen() {
  const { sdkWallet, vtxos, wallet, reloadWallet } = useContext(WalletContext)
  const { aspInfo } = useContext(AspContext)
  const { config } = useContext(ConfigContext)

  const [renewing, setRenewing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const showBalance = config.showBalance
  const nextRollover = wallet.nextRollover
  const now = Math.floor(Date.now() / 1000)
  const timeUntilRollover = nextRollover > now ? nextRollover - now : 0

  const handleRenew = async () => {
    if (!sdkWallet) return
    setRenewing(true)
    setError('')
    setSuccess(false)
    try {
      await renewCoins(sdkWallet, aspInfo.dust, wallet.thresholdMs)
      setSuccess(true)
      reloadWallet()
    } catch (e: any) {
      consoleError(e, 'Renew failed')
      setError(extractError(e))
    } finally {
      setRenewing(false)
    }
  }

  const getStatusTag = (vtxo: Vtxo): { label: string; color: string } | null => {
    if (vtxo.settledBy && vtxo.settledBy.length > 0) return { label: 'settled', color: '#22c55e' }
    if (vtxo.value < Number(aspInfo.dust)) return { label: 'subdust', color: '#f59e0b' }
    const expiry = vtxo.virtualStatus?.batchExpiry ?? 0
    if (expiry > 0 && expiry - now < 86400) return { label: 'expiring soon', color: '#ef4444' }
    return null
  }

  const renderVtxo = ({ item: vtxo }: { item: Vtxo }) => {
    const tag = getStatusTag(vtxo)
    const expiry = vtxo.virtualStatus?.batchExpiry ?? 0
    const expiresIn = expiry > now ? prettyDelta(expiry - now) : ''

    return (
      <View style={styles.vtxoRow}>
        <View style={styles.vtxoLeft}>
          <Text style={styles.vtxoAmount}>
            {showBalance ? `${prettyNumber(vtxo.value)} sats` : prettyHide(vtxo.value)}
          </Text>
          {expiresIn ? <Text style={styles.vtxoExpiry}>Expires in {expiresIn}</Text> : null}
        </View>
        {tag && (
          <Text style={[styles.vtxoTag, { color: tag.color }]}>{tag.label}</Text>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Coin Control</Text>

      {timeUntilRollover > 0 && (
        <View style={styles.rolloverCard}>
          <Text style={styles.rolloverLabel}>Next Renewal</Text>
          <Text style={styles.rolloverValue}>in {prettyDelta(timeUntilRollover)}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Spendable VTXOs ({vtxos.spendable.length})
      </Text>

      {vtxos.spendable.length === 0 ? (
        <Text style={styles.emptyText}>No spendable VTXOs</Text>
      ) : (
        <FlatList
          data={vtxos.spendable}
          keyExtractor={(_, i) => `s${i}`}
          renderItem={renderVtxo}
          style={styles.list}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success && <Text style={styles.success}>Coins renewed successfully!</Text>}

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, renewing && styles.disabled]}
          onPress={handleRenew}
          disabled={renewing || vtxos.spendable.length === 0}
        >
          {renewing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Renew Coins</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  rolloverCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rolloverLabel: { fontSize: 14, color: '#888' },
  rolloverValue: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  list: { flex: 1 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  vtxoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  vtxoLeft: { gap: 2 },
  vtxoAmount: { fontSize: 16, color: '#fff' },
  vtxoExpiry: { fontSize: 12, color: '#888' },
  vtxoTag: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 8 },
  success: { color: '#22c55e', fontSize: 13, textAlign: 'center', marginTop: 8 },
  buttons: { paddingBottom: 20 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
