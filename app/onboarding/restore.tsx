import { useContext, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext } from '@/providers/flow'
import { hex } from '@scure/base'
import { defaultPassword } from '@/lib/constants'

export default function OnboardingRestore() {
  const { initInfo, setInitInfo } = useContext(FlowContext)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleRestore = () => {
    setError('')
    try {
      let privateKey: Uint8Array

      if (input.startsWith('nsec')) {
        // TODO: nsec decoding requires nostr-tools
        setError('nsec restore not yet implemented')
        return
      } else {
        // Hex private key
        const cleaned = input.trim().toLowerCase()
        if (cleaned.length !== 64) {
          setError('Private key must be 64 hex characters')
          return
        }
        privateKey = hex.decode(cleaned)
      }

      if (privateKey.length !== 32) {
        setError('Invalid private key length')
        return
      }

      setInitInfo({ ...initInfo, privateKey, restoring: true, password: defaultPassword })
      router.push('/onboarding/connect')
    } catch (e) {
      setError('Invalid key format')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Restore Wallet</Text>
      <Text style={styles.subtitle}>Enter your private key (hex format)</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Private key (hex)"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, !input && styles.disabled]}
          onPress={handleRestore}
          disabled={!input}
        >
          <Text style={styles.primaryButtonText}>Restore</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  form: { gap: 12, marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 80 },
  error: { color: '#ef4444', fontSize: 13 },
  buttons: { gap: 12, marginTop: 'auto', paddingBottom: 40 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { color: '#888', fontSize: 16 },
  disabled: { opacity: 0.5 },
})
