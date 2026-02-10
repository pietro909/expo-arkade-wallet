import { useContext, useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlowContext } from '@/providers/flow'
import { defaultPassword } from '@/lib/constants'

export default function OnboardingPassword() {
  const { initInfo, setInitInfo } = useContext(FlowContext)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSkip = () => {
    // Use default password
    setInitInfo({ ...initInfo, password: defaultPassword })
    router.push('/onboarding/connect')
  }

  const handleSetPassword = () => {
    if (password.length < 4) return
    if (password !== confirmPassword) return
    setInitInfo({ ...initInfo, password })
    router.push('/onboarding/connect')
  }

  const canSubmit = password.length >= 4 && password === confirmPassword

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Set a Password</Text>
      <Text style={styles.subtitle}>Protect your wallet with a password</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {password.length > 0 && password !== confirmPassword && confirmPassword.length > 0 && (
          <Text style={styles.error}>Passwords do not match</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.disabled]}
          onPress={handleSetPassword}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryButtonText}>Set Password</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
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
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, fontSize: 16 },
  error: { color: '#ef4444', fontSize: 13 },
  buttons: { gap: 12, marginTop: 'auto', paddingBottom: 40 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 12 },
  secondaryButtonText: { color: '#888', fontSize: 16 },
  disabled: { opacity: 0.5 },
})
