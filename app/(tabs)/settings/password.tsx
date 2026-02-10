import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getPrivateKey, setPrivateKey } from '@/lib/privateKey'
import { defaultPassword } from '@/lib/constants'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function PasswordScreen() {
  const [step, setStep] = useState<'old' | 'new' | 'done'>('old')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privateKeyData, setPrivateKeyData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState('')

  const handleVerifyOld = async () => {
    setError('')
    try {
      const pk = await getPrivateKey(oldPassword || defaultPassword)
      setPrivateKeyData(pk)
      setStep('new')
    } catch (e: any) {
      consoleError(e, 'Invalid old password')
      setError('Invalid password')
    }
  }

  const handleSetNew = async () => {
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!privateKeyData) return

    setError('')
    try {
      await setPrivateKey(privateKeyData, newPassword)
      setStep('done')
    } catch (e: any) {
      consoleError(e, 'Failed to update password')
      setError('Failed to update password')
    }
  }

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.checkmark}>&#10003;</Text>
          <Text style={styles.successText}>Password Updated</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to Settings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>
        {step === 'old' ? 'Change Password' : 'Set New Password'}
      </Text>

      {step === 'old' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#666"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
            onSubmitEditing={handleVerifyOld}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleVerifyOld}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      )}

      {step === 'new' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#666"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#666"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleSetNew}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.primaryButton, newPassword.length < 4 && styles.disabled]}
            onPress={handleSetNew}
            disabled={newPassword.length < 4}
          >
            <Text style={styles.primaryButtonText}>Set Password</Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  checkmark: { fontSize: 64, color: '#22c55e' },
  successText: { fontSize: 20, fontWeight: '600', color: '#fff' },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
