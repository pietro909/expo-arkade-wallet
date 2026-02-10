import { useContext } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { FlowContext } from '@/providers/flow'
import { deriveKeyFromSeed } from '@/lib/wallet'

export default function OnboardingInit() {
  const { setInitInfo } = useContext(FlowContext)

  const handleCreate = () => {
    const mnemonic = generateMnemonic(wordlist)
    const seed = mnemonicToSeedSync(mnemonic)
    const privateKey = deriveKeyFromSeed(seed)
    setInitInfo({ privateKey, restoring: false })
    router.push('/onboarding/password')
  }

  const handleRestore = () => {
    setInitInfo({ restoring: true })
    router.push('/onboarding/restore')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Arkade Wallet</Text>
        <Text style={styles.subtitle}>Self-custodial Bitcoin wallet</Text>
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.primaryButton} onPress={handleCreate}>
          <Text style={styles.primaryButtonText}>Create Wallet</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleRestore}>
          <Text style={styles.secondaryButtonText}>Restore Wallet</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
  buttons: { gap: 12, paddingBottom: 40 },
  primaryButton: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: '#7C3AED', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#7C3AED', fontSize: 18, fontWeight: '600' },
})
