import { useContext, useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext, emptySendInfo } from '@/providers/flow'
import { WalletContext } from '@/providers/wallet'
import { AspContext } from '@/providers/asp'
import { FeesContext } from '@/providers/fees'
import { LightningContext } from '@/providers/lightning'
import { LimitsContext } from '@/providers/limits'
import { FiatContext } from '@/providers/fiat'
import { ConfigContext } from '@/providers/config'
import { isArkAddress, isBTCAddress, isLightningInvoice, decodeArkAddress } from '@/lib/address'
import { decodeBip21, isBip21 } from '@/lib/bip21'
import { decodeInvoice } from '@/lib/bolt11'
import { isValidLnUrl, checkLnUrlConditions, fetchInvoice, fetchArkAddress } from '@/lib/lnurl'
import { isArkNote } from '@/lib/arknote'
import { prettyNumber } from '@/lib/format'
import { extractError } from '@/lib/error'
import { defaultFee } from '@/lib/constants'
import { consoleError } from '@/lib/logs'

type RecipientType = 'ark' | 'btc' | 'lightning' | 'lnurl' | null

export default function SendForm() {
  const { sendInfo, setSendInfo } = useContext(FlowContext)
  const { balance, sdkWallet, wallet } = useContext(WalletContext)
  const { aspInfo } = useContext(AspContext)
  const { calcOnchainOutputFee } = useContext(FeesContext)
  const { createSubmarineSwap, calcSubmarineSwapFee } = useContext(LightningContext)
  const { lnSwapsAllowed, utxoTxsAllowed, vtxoTxsAllowed } = useContext(LimitsContext)
  const { toFiat, fromFiat } = useContext(FiatContext)
  const { config } = useContext(ConfigContext)

  const [recipient, setRecipient] = useState(sendInfo.recipient ?? '')
  const [amount, setAmount] = useState(sendInfo.satoshis ? String(sendInfo.satoshis) : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipientType, setRecipientType] = useState<RecipientType>(null)
  const [amountReadonly, setAmountReadonly] = useState(false)
  const [lnUrlMin, setLnUrlMin] = useState(0)
  const [lnUrlMax, setLnUrlMax] = useState(0)

  const sats = Number(amount) || 0

  // Parse recipient when it changes
  useEffect(() => {
    if (!recipient.trim()) {
      setRecipientType(null)
      setAmountReadonly(false)
      setError('')
      return
    }

    const input = recipient.trim().toLowerCase().replace(/^lightning:/, '')

    // BIP21
    if (isBip21(recipient.trim())) {
      try {
        const decoded = decodeBip21(recipient.trim())
        if (decoded.arkAddress) {
          setRecipientType('ark')
          setSendInfo({ ...emptySendInfo, recipient, arkAddress: decoded.arkAddress })
          if (decoded.satoshis) {
            setAmount(String(decoded.satoshis))
            setAmountReadonly(true)
          }
        } else if (decoded.invoice) {
          setRecipientType('lightning')
          const inv = decodeInvoice(decoded.invoice)
          setSendInfo({ ...emptySendInfo, recipient, invoice: decoded.invoice })
          if (inv.amountSats) {
            setAmount(String(inv.amountSats))
            setAmountReadonly(true)
          }
        } else if (decoded.address) {
          setRecipientType('btc')
          setSendInfo({ ...emptySendInfo, recipient, address: decoded.address })
          if (decoded.satoshis) setAmount(String(decoded.satoshis))
        }
        setError('')
        return
      } catch {
        setError('Unable to parse BIP21 URI')
        return
      }
    }

    // Ark address
    if (isArkAddress(input)) {
      // Verify same server
      try {
        const decoded = decodeArkAddress(input)
        if (aspInfo.signerPubkey && decoded.serverPubKey !== aspInfo.signerPubkey) {
          setError('Ark server key mismatch')
          return
        }
      } catch { /* ignore decode errors */ }
      setRecipientType('ark')
      setSendInfo({ ...emptySendInfo, recipient, arkAddress: input })
      setAmountReadonly(false)
      setError('')
      return
    }

    // Lightning invoice
    if (isLightningInvoice(input)) {
      if (!lnSwapsAllowed()) {
        setError('Lightning swaps not enabled')
        return
      }
      const inv = decodeInvoice(input)
      if (inv.amountSats) {
        setAmount(String(inv.amountSats))
        setAmountReadonly(true)
      } else {
        setError('Invoice must have amount defined')
        return
      }
      setRecipientType('lightning')
      setSendInfo({ ...emptySendInfo, recipient, invoice: input })
      setError('')
      return
    }

    // Bitcoin address
    if (isBTCAddress(input)) {
      if (!utxoTxsAllowed()) {
        setError('Onchain transactions not allowed')
        return
      }
      setRecipientType('btc')
      setSendInfo({ ...emptySendInfo, recipient, address: input })
      setAmountReadonly(false)
      setError('')
      return
    }

    // LNURL
    if (isValidLnUrl(input)) {
      if (!lnSwapsAllowed()) {
        setError('Lightning swaps not enabled')
        return
      }
      setRecipientType('lnurl')
      setSendInfo({ ...emptySendInfo, recipient, lnUrl: input })
      setAmountReadonly(false)
      // Fetch LNURL conditions
      checkLnUrlConditions(input)
        .then((data) => {
          const min = Math.ceil(data.minSendable / 1000)
          const max = Math.floor(data.maxSendable / 1000)
          setLnUrlMin(min)
          setLnUrlMax(max)
          if (min === max) {
            setAmount(String(min))
            setAmountReadonly(true)
          }
          setError('')
        })
        .catch(() => {
          setError('Unable to fetch LNURL conditions')
        })
      return
    }

    // Ark Note
    if (isArkNote(input)) {
      // TODO: navigate to note redeem flow
      setError('Ark Note redeeming coming soon')
      return
    }

    setError('Invalid recipient address')
  }, [recipient])

  const fee = (): number => {
    if (recipientType === 'ark') return defaultFee
    if (recipientType === 'lightning') return calcSubmarineSwapFee(sats)
    if (recipientType === 'btc') return calcOnchainOutputFee()
    return 0
  }

  const total = sats + fee()
  const canContinue = recipientType && sats > 0 && !error && total <= balance

  const handleSendAll = () => {
    const f = fee()
    const max = Math.max(0, balance - f)
    setAmount(String(max))
  }

  const handleContinue = async () => {
    if (!canContinue) return
    setError('')
    setLoading(true)

    try {
      const info = { ...sendInfo, satoshis: sats }

      // For Lightning: create submarine swap first
      if (recipientType === 'lightning' && info.invoice && !info.pendingSwap) {
        const swap = await createSubmarineSwap(info.invoice)
        if (!swap) {
          setError('Unable to create swap')
          setLoading(false)
          return
        }
        info.pendingSwap = swap
        info.swapId = swap.response.id
      }

      // For LNURL: try Ark method first, fall back to Lightning invoice
      if (recipientType === 'lnurl' && info.lnUrl) {
        try {
          const arkResponse = await fetchArkAddress(info.lnUrl)
          if (arkResponse?.address && isArkAddress(arkResponse.address)) {
            info.arkAddress = arkResponse.address
            info.invoice = undefined
          } else {
            throw new Error('No Ark method')
          }
        } catch {
          // Fall back to Lightning
          const invoice = await fetchInvoice(info.lnUrl, sats, '')
          info.invoice = invoice
          const swap = await createSubmarineSwap(invoice)
          if (!swap) {
            setError('Unable to create swap')
            setLoading(false)
            return
          }
          info.pendingSwap = swap
          info.swapId = swap.response.id
        }
      }

      setSendInfo(info)
      router.push('/send/details')
    } catch (e: any) {
      consoleError(e, 'Send form error')
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Send</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Recipient</Text>
          <TextInput
            style={styles.input}
            placeholder="Address, invoice, or LNURL"
            placeholderTextColor="#666"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          {recipientType && (
            <Text style={styles.typeLabel}>
              {recipientType === 'ark' ? 'Ark (offchain)' :
               recipientType === 'btc' ? 'Bitcoin (onchain)' :
               recipientType === 'lightning' ? 'Lightning' :
               recipientType === 'lnurl' ? 'LNURL' : ''}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Amount (sats)</Text>
            {!amountReadonly && (
              <Pressable onPress={handleSendAll}>
                <Text style={styles.sendAll}>Send all</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            style={[styles.input, amountReadonly && styles.inputReadonly]}
            placeholder="0"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            editable={!amountReadonly}
          />
          {sats > 0 && (
            <Text style={styles.fiatHint}>
              ~ {prettyNumber(toFiat(sats), 2)} {config.fiat}
            </Text>
          )}
          {lnUrlMin > 0 && lnUrlMax > 0 && !amountReadonly && (
            <Text style={styles.rangeHint}>
              Min: {prettyNumber(lnUrlMin)} — Max: {prettyNumber(lnUrlMax)} sats
            </Text>
          )}
        </View>

        {sats > 0 && recipientType && (
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Fee</Text>
            <Text style={styles.feeValue}>{prettyNumber(fee())} sats</Text>
          </View>
        )}

        {sats > 0 && total > balance && (
          <Text style={styles.errorText}>
            Insufficient funds (balance: {prettyNumber(balance)} sats)
          </Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, !canContinue && styles.disabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Review</Text>
          )}
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10, marginBottom: 24 },
  field: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  sendAll: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#111',
  },
  inputReadonly: { opacity: 0.6 },
  typeLabel: { fontSize: 12, color: '#7C3AED', marginTop: 6 },
  fiatHint: { fontSize: 13, color: '#888', marginTop: 6 },
  rangeHint: { fontSize: 12, color: '#666', marginTop: 4 },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#222',
    marginBottom: 8,
  },
  feeLabel: { fontSize: 14, color: '#888' },
  feeValue: { fontSize: 14, color: '#fff' },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 4, marginBottom: 8 },
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
