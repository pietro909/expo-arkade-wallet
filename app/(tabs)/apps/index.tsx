import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AppsIndex() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Apps</Text>

      <Pressable style={styles.card} onPress={() => router.push('/(tabs)/apps/boltz')}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Boltz</Text>
          <Text style={styles.tagNew}>LIVE</Text>
        </View>
        <Text style={styles.cardDescription}>Lightning swaps via Boltz exchange</Text>
      </Pressable>

      <View style={[styles.card, styles.cardDisabled]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fuji Money</Text>
          <Text style={styles.tagSoon}>COMING SOON</Text>
        </View>
        <Text style={styles.cardDescription}>Synthetic assets on Bitcoin</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardDisabled: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  tagNew: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    backgroundColor: '#7C3AED20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tagSoon: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
    backgroundColor: '#22c55e20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardDescription: { color: '#888', fontSize: 14 },
})
