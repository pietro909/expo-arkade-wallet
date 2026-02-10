import { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LightningContext } from '@/providers/lightning'
import { FlowContext } from '@/providers/flow'
import { PendingSwap } from '@/lib/types'
import { isReverseFinalStatus, isSubmarineFinalStatus, BoltzSwapStatus } from '@arkade-os/boltz-swap'
import { prettyNumber, prettyAgo, prettyLongText } from '@/lib/format'
import { consoleError } from '@/lib/logs'

export default function BoltzIndex() {
  const { connected, getApiUrl, getSwapHistory } = useContext(LightningContext)
  const { setSwapInfo } = useContext(FlowContext)

  const [swaps, setSwaps] = useState<PendingSwap[]>([])
  const [loading, setLoading] = useState(true)

  const apiUrl = getApiUrl()

  useEffect(() => {
    loadSwaps()
  }, [connected])

  const loadSwaps = async () => {
    setLoading(true)
    try {
      const history = await getSwapHistory()
      setSwaps(history)
    } catch (e) {
      consoleError(e, 'Failed to load swaps')
    } finally {
      setLoading(false)
    }
  }

  const handleSwapPress = (swap: PendingSwap) => {
    setSwapInfo(swap)
    router.push(`/(tabs)/apps/boltz/${swap.response.id}`)
  }

  const renderSwapItem = ({ item: swap }: { item: PendingSwap }) => {
    const isReverse = 'onchainAmount' in swap.response
    const kind = isReverse ? 'Reverse' : 'Submarine'
    const status = swap.status ?? 'unknown'

    return (
      <Pressable style={styles.swapRow} onPress={() => handleSwapPress(swap)}>
        <View style={styles.swapLeft}>
          <Text style={styles.swapKind}>{kind}</Text>
          <Text style={styles.swapId}>{prettyLongText(swap.response.id, 6)}</Text>
        </View>
        <View style={styles.swapRight}>
          <Text style={[styles.swapStatus, (status === 'transaction.claimed' || status === 'invoice.settled') && styles.statusGreen]}>
            {status}
          </Text>
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Boltz</Text>
        <Pressable onPress={() => router.push('/(tabs)/apps/boltz/settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>API Server</Text>
          <Text style={styles.statusValue}>{apiUrl ?? 'No server available'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={styles.statusDot}>
            <View style={[styles.dot, connected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusValue}>{connected ? 'Connected' : 'Disconnected'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Swaps</Text>

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={styles.loader} />
      ) : swaps.length === 0 ? (
        <Text style={styles.emptyText}>No swaps yet</Text>
      ) : (
        <FlatList
          data={swaps}
          keyExtractor={(item) => item.response.id}
          renderItem={renderSwapItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  back: { color: '#7C3AED', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  settingsIcon: { fontSize: 22, color: '#888' },
  statusCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 14, color: '#888' },
  statusValue: { fontSize: 14, color: '#fff' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: '#22c55e' },
  dotRed: { backgroundColor: '#ef4444' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  loader: { marginTop: 40 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  swapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  swapLeft: { gap: 2 },
  swapKind: { fontSize: 16, fontWeight: '500', color: '#fff' },
  swapId: { fontSize: 13, color: '#888' },
  swapRight: { alignItems: 'flex-end' },
  swapStatus: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  statusGreen: { color: '#22c55e' },
})
