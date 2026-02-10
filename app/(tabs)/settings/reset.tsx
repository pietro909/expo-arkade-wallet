import { useContext, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WalletContext } from '@/providers/wallet'
import { ConfigContext } from '@/providers/config'
import { deletePrivateKey } from '@/lib/privateKey'
import { defaultPassword } from '@/lib/constants'

export default function ResetScreen() {
  const { resetWallet } = useContext(WalletContext)
  const { resetConfig } = useContext(ConfigContext)
  const [confirmed, setConfirmed] = useState(false)

  const handleReset = async () => {
    await deletePrivateKey(defaultPassword).catch(() => {})
    await resetWallet()
    resetConfig()
    router.replace('/onboarding')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Reset Wallet</Text>

      <View style={styles.content}>
        <Text style={styles.warning}>
          This will permanently delete your wallet data. This action cannot be undone.
        </Text>

        <View style={styles.confirmRow}>
          <Switch
            value={confirmed}
            onValueChange={setConfirmed}
            trackColor={{ false: '#333', true: '#ef4444' }}
            thumbColor="#fff"
          />
          <Text style={styles.confirmText}>I have backed up my wallet</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.dangerButton, !confirmed && styles.disabled]}
          onPress={handleReset}
          disabled={!confirmed}
        >
          <Text style={styles.dangerButtonText}>Reset Wallet</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  content: { flex: 1, gap: 24 },
  warning: { fontSize: 16, color: '#ef4444', lineHeight: 24 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  confirmText: { fontSize: 16, color: '#fff' },
  buttons: { paddingBottom: 40 },
  dangerButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.3 },
})
