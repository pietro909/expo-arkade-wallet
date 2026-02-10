import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version ?? '0.0.1'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>About</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>App</Text>
          <Text style={styles.value}>Arkade Wallet</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{appVersion}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Platform</Text>
          <Text style={styles.value}>Expo / React Native</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Self-custodial Bitcoin wallet powered by Ark protocol.
      </Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 14, color: '#fff' },
  footer: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40, lineHeight: 22 },
})
