import { useContext, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { FlowContext } from '@/providers/flow'
import { WalletContext } from '@/providers/wallet'
import { LightningContext } from '@/providers/lightning'
import { LimitsContext } from '@/providers/limits'
import { NotificationsContext } from '@/providers/notifications'
import { encodeBip21 } from '@/lib/bip21'
import { getBalance } from '@/lib/asp'
import { prettyNumber, prettyLongText } from '@/lib/format'
import { consoleError, consoleLog } from '@/lib/logs'

export default function ReceiveQrCode() {
  const { recvInfo, setRecvInfo } = useContext(FlowContext)
  const { sdkWallet, reloadWallet } = useContext(WalletContext)
  const { createReverseSwap, arkadeLightning } = useContext(LightningContext)
  const { validLnSwap, validUtxoTx, utxoTxsAllowed, validVtxoTx, vtxoTxsAllowed } = useContext(LimitsContext)
  const { notifyPaymentReceived } = useContext(NotificationsContext)

  const [invoice, setInvoice] = useState('')
  const [qrReady, setQrReady] = useState(false)
  const [showLnWarning, setShowLnWarning] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevBalanceRef = useRef<number | null>(null)

  const sats = recvInfo.satoshis
  const boardingAddr = recvInfo.boardingAddr
  const offchainAddr = recvInfo.offchainAddr

  // Build BIP21 URI
  const bip21 = boardingAddr && offchainAddr
    ? encodeBip21(boardingAddr, offchainAddr, invoice, sats)
    : ''

  const qrValue = bip21 || offchainAddr || boardingAddr

  // Create Lightning reverse swap if applicable
  useEffect(() => {
    if (!sdkWallet || !arkadeLightning || !sats || !validLnSwap(sats)) {
      setQrReady(true)
      return
    }

    createReverseSwap(sats)
      .then(async (pendingSwap) => {
        if (pendingSwap?.response?.invoice) {
          setInvoice(pendingSwap.response.invoice)
          setShowLnWarning(true)

          // Wait for claim in background
          try {
            await arkadeLightning.waitAndClaim(pendingSwap)
            const received = pendingSwap.response.onchainAmount ?? sats
            setRecvInfo({ ...recvInfo, satoshis: received })
            notifyPaymentReceived(received)
            reloadWallet()
            router.replace('/receive/success')
            return
          } catch (e) {
            consoleError(e, 'Lightning claim failed')
          }
        }
        setQrReady(true)
      })
      .catch((e) => {
        consoleError(e, 'Reverse swap creation failed')
        setQrReady(true)
      })
  }, [sdkWallet, arkadeLightning])

  // Poll for balance changes (VTXO/UTXO payment detection)
  useEffect(() => {
    if (!sdkWallet) return

    const checkBalance = async () => {
      try {
        const currentBalance = await getBalance(sdkWallet)
        if (prevBalanceRef.current !== null && currentBalance > prevBalanceRef.current) {
          const received = currentBalance - prevBalanceRef.current
          consoleLog('Payment detected via balance polling:', received)
          setRecvInfo({ ...recvInfo, satoshis: received })
          notifyPaymentReceived(received)
          reloadWallet()
          router.replace('/receive/success')
        }
        prevBalanceRef.current = currentBalance
      } catch (e) {
        consoleError(e, 'Balance poll failed')
      }
    }

    checkBalance()
    pollingRef.current = setInterval(checkBalance, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [sdkWallet])

  const handleShare = async () => {
    try {
      await Share.share({ message: qrValue })
    } catch (e) {
      consoleError(e, 'Share failed')
    }
  }

  if (!qrValue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Generating address...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receive Payment</Text>

      <View style={styles.qrContainer}>
        {!qrReady ? (
          <View style={styles.qrLoading}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Creating Lightning invoice...</Text>
          </View>
        ) : (
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrValue}
              size={220}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
        )}

        {sats > 0 && (
          <Text style={styles.amount}>{prettyNumber(sats)} sats</Text>
        )}

        {showLnWarning && (
          <Text style={styles.lnWarning}>Keep app open to receive Lightning payment</Text>
        )}

        <View style={styles.addressSection}>
          {offchainAddr && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Ark</Text>
              <Text style={styles.addressValue}>{prettyLongText(offchainAddr, 10)}</Text>
            </View>
          )}
          {boardingAddr && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Onchain</Text>
              <Text style={styles.addressValue}>{prettyLongText(boardingAddr, 10)}</Text>
            </View>
          )}
          {invoice && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Lightning</Text>
              <Text style={styles.addressValue}>{prettyLongText(invoice, 10)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: '#888' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10, marginBottom: 24, textAlign: 'center' },
  qrContainer: { flex: 1, alignItems: 'center', gap: 16 },
  qrLoading: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', gap: 12 },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  amount: { fontSize: 20, fontWeight: '600', color: '#fff' },
  lnWarning: { fontSize: 13, color: '#f59e0b', textAlign: 'center' },
  addressSection: { width: '100%', gap: 8, marginTop: 8 },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  addressLabel: { fontSize: 12, color: '#888', width: 65 },
  addressValue: { fontSize: 13, color: '#fff', flex: 1, textAlign: 'right' },
  buttons: { gap: 12, paddingBottom: 20 },
  shareButton: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { color: '#888', fontSize: 16 },
})
