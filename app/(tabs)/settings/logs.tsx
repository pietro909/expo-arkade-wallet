import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getLogs, clearLogs, LogLine } from '@/lib/logs'

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogLine[]>(getLogs())

  const handleClear = () => {
    clearLogs()
    setLogs([])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Pressable onPress={handleClear}>
          <Text style={styles.clear}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Logs</Text>

      <ScrollView style={styles.logContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs</Text>
        ) : (
          logs.map((log, i) => (
            <Text key={i} style={[styles.logLine, log.level === 'error' && styles.logError]}>
              [{log.level}] {log.msg}
            </Text>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  back: { color: '#7C3AED', fontSize: 16 },
  clear: { color: '#ef4444', fontSize: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  logContainer: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 12 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20 },
  logLine: { color: '#aaa', fontSize: 12, fontFamily: 'monospace', marginBottom: 4, lineHeight: 18 },
  logError: { color: '#ef4444' },
})
