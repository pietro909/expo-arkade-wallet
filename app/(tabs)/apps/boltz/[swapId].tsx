import { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext } from '@/providers/flow'
import { LightningContext } from '@/providers/lightning'
import { ConfigContext } from '@/providers/config'
import {
  BoltzSwapStatus,
  PendingReverseSwap,
  PendingSubmarineSwap,
  isReverseClaimableStatus,
  isSubmarineSwapRefundable,
} from '@arkade-os/boltz-swap'
import { decodeInvoice } from '@/lib/bolt11'
import { prettyNumber, prettyLongText, prettyHide } from '@/lib/format'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function SwapDetail() {
  const { swapInfo } = useContext(FlowContext)
  const { claimVHTLC, refundVHTLC, swapManager } = useContext(LightningContext)
  const { config } = useContext(ConfigContext)

  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [refunded, setRefunded] = useState(false)
  const [error, setError] = useState('')
  const [currentStatus, setCurrentStatus] = useState(swapInfo?.status ?? '')

  const isReverse = swapInfo && 'onchainAmount' in (swapInfo.response ?? {})
  const showBalance = config.showBalance

  // Subscribe to live status updates
  useEffect(() => {
    if (!swapManager || !swapInfo) return
    let cleanup: (() => void) | undefined
    swapManager.subscribeToSwapUpdates(swapInfo.response.id, (update: any) => {
      if (update?.status) setCurrentStatus(update.status)
    }).then((unsub) => { cleanup = unsub })
    return () => { cleanup?.() }
  }, [swapManager, swapInfo])

  if (!swapInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No swap data available</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  // Extract swap details based on type
  let amount = 0
  let address = ''
  let invoice = ''
  let swapFee = 0

  if (isReverse) {
    const rev = swapInfo as PendingReverseSwap
    amount = rev.response.onchainAmount ?? 0
    address = rev.response.lockupAddress ?? ''
    invoice = rev.response.invoice ?? ''
  } else {
    const sub = swapInfo as PendingSubmarineSwap
    address = sub.response.address ?? ''
    invoice = (sub as any).request?.invoice ?? ''
    if (invoice) {
      try {
        const decoded = decodeInvoice(invoice)
        amount = decoded.amountSats
      } catch { /* ignore */ }
    }
  }

  const isClaimable = isReverse && currentStatus && isReverseClaimableStatus(currentStatus as BoltzSwapStatus)
  const isRefundable = !isReverse && isSubmarineSwapRefundable(swapInfo as PendingSubmarineSwap)

  const handleAction = async () => {
    setProcessing(true)
    setError('')
    try {
      if (isClaimable) {
        await claimVHTLC(swapInfo as PendingReverseSwap)
        setSuccess(true)
      } else if (isRefundable) {
        await refundVHTLC(swapInfo as PendingSubmarineSwap)
        setRefunded(true)
      }
    } catch (e: any) {
      consoleError(e, 'Swap action failed')
      setError(extractError(e))
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.processingText}>Processing swap...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.checkmark}>&#10003;</Text>
          <Text style={styles.successText}>Swap completed successfully</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to Swaps</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  if (refunded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.refundIcon}>↩</Text>
          <Text style={styles.successText}>Swap refunded</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to Swaps</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Swap Details</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Kind</Text>
            <Text style={styles.value}>{isReverse ? 'Reverse Swap' : 'Submarine Swap'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.value}>{prettyLongText(swapInfo.response.id, 8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.statusText]}>{currentStatus || 'unknown'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Direction</Text>
            <Text style={styles.value}>{isReverse ? 'Lightning → Ark' : 'Ark → Lightning'}</Text>
          </View>
          {amount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>
                {showBalance ? `${prettyNumber(amount)} sats` : prettyHide(amount)}
              </Text>
            </View>
          )}
          {address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{prettyLongText(address, 10)}</Text>
            </View>
          )}
          {invoice && (
            <View style={styles.row}>
              <Text style={styles.label}>Invoice</Text>
              <Text style={styles.value}>{prettyLongText(invoice, 10)}</Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {(isClaimable || isRefundable) && (
        <View style={styles.buttons}>
          <Pressable style={styles.primaryButton} onPress={handleAction}>
            <Text style={styles.primaryButtonText}>
              {isClaimable ? 'Complete Swap' : 'Refund Swap'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  scroll: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, color: '#fff', maxWidth: '60%', textAlign: 'right' },
  statusText: { textTransform: 'capitalize' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  checkmark: { fontSize: 64, color: '#22c55e' },
  refundIcon: { fontSize: 48, color: '#f59e0b' },
  processingText: { fontSize: 16, color: '#888' },
  successText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 16 },
  buttons: { paddingBottom: 20 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
})
