import { useContext, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LightningContext } from '@/providers/lightning'
import { extractError } from '@/lib/error'
import { consoleError } from '@/lib/logs'

export default function BoltzSettings() {
  const { connected, toggleConnection, getApiUrl, restoreSwaps } = useContext(LightningContext)

  const [resultMessage, setResultMessage] = useState('')
  const tapCountRef = useRef(0)

  const apiUrl = getApiUrl()

  const handleApiUrlTap = async () => {
    tapCountRef.current += 1
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      try {
        const count = await restoreSwaps()
        if (count > 0) {
          setResultMessage(`Successfully restored ${count} swap${count > 1 ? 's' : ''}`)
        } else {
          setResultMessage('Unable to find swaps available to restore')
        }
      } catch (e: any) {
        consoleError(e, 'Error restoring swaps')
        setResultMessage(`Error restoring swaps: ${extractError(e)}`)
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Boltz Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Boltz</Text>
          <Switch
            value={connected}
            onValueChange={toggleConnection}
            trackColor={{ false: '#333', true: '#7C3AED' }}
            thumbColor="#fff"
          />
        </View>

        <Pressable style={styles.urlRow} onPress={handleApiUrlTap}>
          <Text style={styles.label}>API URL</Text>
          <Text style={styles.urlValue}>{apiUrl ?? 'No server available'}</Text>
        </Pressable>
      </View>

      {resultMessage ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  back: { color: '#7C3AED', fontSize: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, color: '#fff' },
  urlRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  urlValue: { fontSize: 13, color: '#888', marginTop: 4 },
  resultBox: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
  },
  resultText: { color: '#888', fontSize: 14, textAlign: 'center' },
})
