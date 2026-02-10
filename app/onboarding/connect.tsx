import { useContext, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext, emptyInitInfo } from '@/providers/flow'
import { WalletContext } from '@/providers/wallet'
import { setPrivateKey } from '@/lib/privateKey'
import { defaultPassword } from '@/lib/constants'
import { consoleError } from '@/lib/logs'

export default function OnboardingConnect() {
  const { initInfo, setInitInfo } = useContext(FlowContext)
  const { initWallet } = useContext(WalletContext)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const connect = async () => {
      if (!initInfo.privateKey) {
        setError('No private key found')
        return
      }

      try {
        // Store encrypted private key
        const password = initInfo.password ?? defaultPassword
        await setPrivateKey(initInfo.privateKey, password)

        // Initialize the wallet with the SDK
        await initWallet(initInfo.privateKey)

        // Clear init info
        setInitInfo(emptyInitInfo)

        // Navigate to success
        router.replace('/onboarding/success')
      } catch (err) {
        consoleError(err, 'Failed to initialize wallet')
        setError('Failed to connect to server. Please try again.')
      }
    }

    connect()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.retry} onPress={() => router.back()}>
              Go back
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.text}>Connecting to server...</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  text: { fontSize: 16, color: '#888' },
  error: { fontSize: 16, color: '#ef4444', textAlign: 'center', paddingHorizontal: 32 },
  retry: { fontSize: 16, color: '#7C3AED', marginTop: 16 },
})
