import { useContext, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { WalletContext } from '@/providers/wallet'
import { getPrivateKey } from '@/lib/privateKey'
import { defaultPassword } from '@/lib/constants'
import { hex } from '@scure/base'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function BackupScreen() {
  const { wallet } = useContext(WalletContext)

  const [password, setPassword] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleReveal = async () => {
    setError('')
    try {
      const pk = await getPrivateKey(password || defaultPassword)
      setPrivateKey(hex.encode(pk))
      setRevealed(true)
    } catch (e: any) {
      consoleError(e, 'Failed to reveal key')
      setError('Invalid password')
    }
  }

  const handleCopy = async () => {
    await Clipboard.setStringAsync(privateKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Backup</Text>

      {!revealed ? (
        <View style={styles.form}>
          <Text style={styles.warning}>
            Enter your password to reveal your private key. Never share it with anyone.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleReveal}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleReveal}>
            <Text style={styles.primaryButtonText}>Reveal Private Key</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.warning}>
            Keep this key safe. Anyone with access to it can control your funds.
          </Text>
          <View style={styles.keyBox}>
            <Text style={styles.keyText} selectable>{privateKey}</Text>
          </View>
          <Pressable style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Text>
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
  form: { gap: 16 },
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
  keyBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  keyText: { color: '#fff', fontSize: 14, fontFamily: 'monospace', lineHeight: 22 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  copyButton: { borderWidth: 1, borderColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  copyButtonText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
})
