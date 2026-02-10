import { useContext, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext } from '@/providers/flow'
import { WalletContext } from '@/providers/wallet'
import { FeesContext } from '@/providers/fees'
import { LightningContext } from '@/providers/lightning'
import { LimitsContext } from '@/providers/limits'
import { sendOffChain, collaborativeExitWithFees } from '@/lib/asp'
import { prettyNumber, prettyLongText } from '@/lib/format'
import { extractError } from '@/lib/error'
import { defaultFee } from '@/lib/constants'
import { consoleError } from '@/lib/logs'

export default function SendDetails() {
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { balance, sdkWallet, reloadWallet } = useContext(WalletContext)
  const { calcOnchainOutputFee } = useContext(FeesContext)
  const { payInvoice, calcSubmarineSwapFee } = useContext(LightningContext)
  const { vtxoTxsAllowed, lnSwapsAllowed, utxoTxsAllowed } = useContext(LimitsContext)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const sats = sendInfo.satoshis ?? 0

  // Determine transaction type
  const isArkTx = !!sendInfo.arkAddress && vtxoTxsAllowed()
  const isLightningTx = !!sendInfo.invoice && !!sendInfo.pendingSwap && lnSwapsAllowed()
  const isOnchainTx = !!sendInfo.address && utxoTxsAllowed()

  const fee = isArkTx
    ? defaultFee
    : isLightningTx
      ? calcSubmarineSwapFee(sats)
      : isOnchainTx
        ? calcOnchainOutputFee()
        : 0

  const total = sats + fee

  const direction = isArkTx
    ? 'Paying inside the Ark'
    : isLightningTx
      ? 'Swapping to Lightning'
      : isOnchainTx
        ? 'Paying to mainnet'
        : 'Unknown'

  const destination = sendInfo.arkAddress ?? sendInfo.address ?? sendInfo.invoice ?? ''
  const insufficientFunds = total > balance

  const handleSign = async () => {
    if (!sdkWallet || insufficientFunds) return
    setSending(true)
    setError('')

    try {
      let txid = ''

      if (isArkTx && sendInfo.arkAddress) {
        txid = await sendOffChain(sdkWallet, total, sendInfo.arkAddress)
      } else if (isLightningTx && sendInfo.pendingSwap) {
        const result = await payInvoice(sendInfo.pendingSwap)
        txid = result.txid
      } else if (isOnchainTx && sendInfo.address) {
        txid = await collaborativeExitWithFees(sdkWallet, total, sats, sendInfo.address)
      } else {
        throw new Error('No valid destination')
      }

      if (!txid) throw new Error('Error sending transaction')

      setSendInfo({ ...sendInfo, txid, total })
      reloadWallet()
      router.replace('/send/success')
    } catch (e: any) {
      consoleError(e, 'Send failed')
      setError(extractError(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Review Transaction</Text>

        <View style={styles.card}>
          <Text style={styles.direction}>{direction}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {prettyLongText(destination, 14)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{prettyNumber(sats)} sats</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>{prettyNumber(fee)} sats</Text>
          </View>

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{prettyNumber(total)} sats</Text>
          </View>

          {sendInfo.swapId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Swap ID</Text>
              <Text style={styles.detailValue}>{prettyLongText(sendInfo.swapId, 8)}</Text>
            </View>
          )}
        </View>

        {insufficientFunds && (
          <Text style={styles.errorText}>
            Insufficient funds (balance: {prettyNumber(balance)} sats)
          </Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, (insufficientFunds || sending) && styles.disabled]}
          onPress={handleSign}
          disabled={insufficientFunds || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm & Send</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()} disabled={sending}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10, marginBottom: 24 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  direction: { fontSize: 14, color: '#7C3AED', fontWeight: '600', marginBottom: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, color: '#fff', maxWidth: '60%', textAlign: 'right' },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#888' },
  totalValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 16, textAlign: 'center' },
  buttons: { padding: 20, gap: 12, paddingBottom: 40 },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { color: '#888', fontSize: 16 },
  disabled: { opacity: 0.5 },
})
