import { useContext, useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext, emptyRecvInfo } from '@/providers/flow'
import { WalletContext } from '@/providers/wallet'
import { AspContext } from '@/providers/asp'
import { LightningContext } from '@/providers/lightning'
import { LimitsContext } from '@/providers/limits'
import { FiatContext } from '@/providers/fiat'
import { ConfigContext } from '@/providers/config'
import { getReceivingAddresses } from '@/lib/asp'
import { callFaucet, pingFaucet } from '@/lib/faucet'
import { prettyNumber } from '@/lib/format'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function ReceiveAmount() {
  const { recvInfo, setRecvInfo } = useContext(FlowContext)
  const { balance, sdkWallet } = useContext(WalletContext)
  const { aspInfo } = useContext(AspContext)
  const { calcReverseSwapFee } = useContext(LightningContext)
  const { validLnSwap, amountIsAboveMaxLimit, amountIsBelowMinLimit } = useContext(LimitsContext)
  const { toFiat } = useContext(FiatContext)
  const { config } = useContext(ConfigContext)

  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [faucetAvailable, setFaucetAvailable] = useState(false)
  const [fauceting, setFauceting] = useState(false)
  const [faucetSuccess, setFaucetSuccess] = useState(false)

  const sats = Number(amount) || 0

  // Fetch addresses and check faucet on mount
  useEffect(() => {
    if (!sdkWallet) return
    getReceivingAddresses(sdkWallet)
      .then(({ boardingAddr, offchainAddr }) => {
        setRecvInfo({ ...emptyRecvInfo, boardingAddr, offchainAddr, satoshis: 0 })
      })
      .catch((e) => {
        consoleError(e, 'Failed to fetch addresses')
        setError(extractError(e))
      })
  }, [sdkWallet])

  useEffect(() => {
    if (balance === 0 && aspInfo.network) {
      pingFaucet(aspInfo).then(setFaucetAvailable)
    }
  }, [balance, aspInfo.network])

  const lnFee = validLnSwap(sats) ? calcReverseSwapFee(sats) : 0

  const getButtonLabel = (): string => {
    if (sats > 0 && amountIsAboveMaxLimit(sats)) return 'Above max limit'
    if (sats > 0 && amountIsBelowMinLimit(sats)) return 'Below min limit'
    if (sats === 0) return 'Show Address'
    return 'Continue'
  }

  const handleContinue = () => {
    setRecvInfo({ ...recvInfo, satoshis: sats })
    router.push({ pathname: '/receive/qrcode', params: { amount: String(sats) } })
  }

  const handleFaucet = async () => {
    if (!sdkWallet || !recvInfo.offchainAddr) return
    setFauceting(true)
    try {
      const success = await callFaucet(recvInfo.offchainAddr, 10000, aspInfo)
      if (success) {
        setFaucetSuccess(true)
      } else {
        setError('Faucet request failed')
      }
    } catch (e) {
      consoleError(e, 'Faucet failed')
      setError(extractError(e))
    } finally {
      setFauceting(false)
    }
  }

  if (faucetSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.faucetSuccess}>
          <Text style={styles.checkmark}>&#10003;</Text>
          <Text style={styles.faucetTitle}>Faucet Sent!</Text>
          <Text style={styles.faucetSubtitle}>10,000 sats are on their way</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryButtonText}>Back to Wallet</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Receive</Text>
        <Text style={styles.subtitle}>Enter an amount (optional)</Text>

        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="Amount (sats)"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          {sats > 0 && (
            <Text style={styles.fiatHint}>
              ~ {prettyNumber(toFiat(sats), 2)} {config.fiat}
            </Text>
          )}
          {lnFee > 0 && (
            <Text style={styles.feeHint}>
              Lightning fees: ~{prettyNumber(lnFee)} sats
            </Text>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.buttons}>
        {balance === 0 && faucetAvailable && (
          <Pressable
            style={[styles.faucetButton, fauceting && styles.disabled]}
            onPress={handleFaucet}
            disabled={fauceting}
          >
            {fauceting ? (
              <ActivityIndicator color="#7C3AED" />
            ) : (
              <Text style={styles.faucetButtonText}>Get test sats (faucet)</Text>
            )}
          </Pressable>
        )}
        <Pressable
          style={[
            styles.primaryButton,
            (sats > 0 && (amountIsAboveMaxLimit(sats) || amountIsBelowMinLimit(sats))) && styles.disabled,
          ]}
          onPress={handleContinue}
          disabled={loading || (sats > 0 && (amountIsAboveMaxLimit(sats) || amountIsBelowMinLimit(sats)))}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{getButtonLabel()}</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 10, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  field: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#111',
  },
  fiatHint: { fontSize: 13, color: '#888', marginTop: 6 },
  feeHint: { fontSize: 13, color: '#f59e0b', marginTop: 6 },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 4 },
  buttons: { padding: 20, gap: 12, paddingBottom: 40 },
  faucetButton: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  faucetButtonText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
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
  faucetSuccess: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16 },
  checkmark: { fontSize: 64, color: '#22c55e' },
  faucetTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  faucetSubtitle: { fontSize: 16, color: '#888' },
})
