import { useContext, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext } from '@/providers/flow'
import { FiatContext } from '@/providers/fiat'
import { ConfigContext } from '@/providers/config'
import { NotificationsContext } from '@/providers/notifications'
import { prettyAmount, prettyNumber } from '@/lib/format'
import { CurrencyDisplay } from '@/lib/types'

export default function ReceiveSuccess() {
  const { recvInfo } = useContext(FlowContext)
  const { toFiat } = useContext(FiatContext)
  const { config } = useContext(ConfigContext)
  const { notifyPaymentReceived } = useContext(NotificationsContext)

  const sats = recvInfo.satoshis ?? 0

  useEffect(() => {
    if (sats > 0) notifyPaymentReceived(sats)
  }, [sats])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.checkmark}>&#10003;</Text>
        <Text style={styles.title}>Payment Received</Text>
        <Text style={styles.amount}>{prettyAmount(sats)}</Text>
        {config.currencyDisplay !== CurrencyDisplay.Sats && sats > 0 && (
          <Text style={styles.fiat}>
            ~ {prettyNumber(toFiat(sats), 2)} {config.fiat}
          </Text>
        )}
        <Text style={styles.subtitle}>received successfully</Text>
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Back to Wallet</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 64, color: '#22c55e', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  amount: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  fiat: { fontSize: 16, color: '#888', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
  buttons: { paddingBottom: 40 },
  button: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
})
