import { useContext, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ConfigContext } from '@/providers/config'
import { WalletContext } from '@/providers/wallet'
import { getAspInfo } from '@/lib/asp'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function ServerScreen() {
  const { config, updateConfig } = useContext(ConfigContext)
  const { resetWallet } = useContext(WalletContext)

  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [serverFound, setServerFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (!url.trim()) return
    setError('')
    setServerFound(false)
    setLoading(true)

    try {
      const info = await getAspInfo(url.trim())
      if (info.unreachable) {
        setError('Server unreachable')
        setLoading(false)
        return
      }
      setServerFound(true)
    } catch (e: any) {
      consoleError(e, 'Server check failed')
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleChangeServer = async () => {
    await updateConfig({ ...config, aspUrl: url.trim() })
    await resetWallet()
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Server</Text>
      <Text style={styles.subtitle}>Current: {config.aspUrl}</Text>

      <View style={styles.form}>
        <Text style={styles.warning}>
          Changing server will reset your wallet. Make sure you backup first.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="New server URL"
          placeholderTextColor="#666"
          value={url}
          onChangeText={(v) => { setUrl(v); setServerFound(false); setError('') }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {serverFound && <Text style={styles.success}>Server found!</Text>}
      </View>

      <View style={styles.buttons}>
        {!serverFound ? (
          <Pressable
            style={[styles.primaryButton, (!url.trim() || loading) && styles.disabled]}
            onPress={handleConnect}
            disabled={!url.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Check Server</Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.dangerButton} onPress={handleChangeServer}>
            <Text style={styles.dangerButtonText}>Change Server & Reset Wallet</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  form: { gap: 12, flex: 1 },
  warning: { fontSize: 14, color: '#f59e0b', lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#111',
  },
  error: { color: '#ef4444', fontSize: 13 },
  success: { color: '#22c55e', fontSize: 13 },
  buttons: { paddingBottom: 40 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  dangerButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
