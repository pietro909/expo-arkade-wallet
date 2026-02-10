import { useContext, useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WalletContext } from '@/providers/wallet'
import { getPrivateKey, noUserDefinedPassword } from '@/lib/privateKey'
import { defaultPassword } from '@/lib/constants'
import { consoleError } from '@/lib/logs'

export default function UnlockScreen() {
  const { initWallet } = useContext(WalletContext)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Try default password first
  useEffect(() => {
    noUserDefinedPassword().then(async (isDefault) => {
      if (isDefault) {
        try {
          const pk = await getPrivateKey(defaultPassword)
          await initWallet(pk)
          router.replace('/(tabs)')
          return
        } catch (e) {
          consoleError(e, 'Auto-unlock failed')
        }
      }
      setLoading(false)
    })
  }, [])

  const handleUnlock = async () => {
    setError('')
    setLoading(true)
    try {
      const pk = await getPrivateKey(password)
      await initWallet(pk)
      router.replace('/(tabs)')
    } catch (e) {
      setError('Invalid password')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Unlocking...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Unlock Wallet</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleUnlock}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, !password && styles.disabled]}
          onPress={handleUnlock}
          disabled={!password}
        >
          <Text style={styles.buttonText}>Unlock</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: { flex: 1, justifyContent: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16 },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  loadingText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 16 },
  buttons: { paddingBottom: 40 },
  button: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
