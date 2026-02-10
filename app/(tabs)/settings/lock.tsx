import { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WalletContext } from '@/providers/wallet'
import { noUserDefinedPassword } from '@/lib/privateKey'

export default function LockScreen() {
  const { lockWallet } = useContext(WalletContext)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  useEffect(() => {
    noUserDefinedPassword().then((isDefault) => setHasPassword(!isDefault))
  }, [])

  const handleLock = async () => {
    await lockWallet()
    router.replace('/unlock')
  }

  if (hasPassword === null) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Lock Wallet</Text>

      {!hasPassword ? (
        <View style={styles.content}>
          <Text style={styles.message}>
            You need to set a password before you can lock your wallet.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/settings/password')}
          >
            <Text style={styles.primaryButtonText}>Set Password</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.message}>
            Locking your wallet will require your password to access it again.
          </Text>
          <Pressable style={styles.dangerButton} onPress={handleLock}>
            <Text style={styles.dangerButtonText}>Lock Wallet</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  content: { gap: 20 },
  message: { fontSize: 16, color: '#888', lineHeight: 24 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  dangerButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
})
