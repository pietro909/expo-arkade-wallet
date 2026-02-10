import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

type MenuItem = { label: string; route: string; section: 'general' | 'security' | 'advanced' }

const menuItems: MenuItem[] = [
  { label: 'Backup', route: '/(tabs)/settings/backup', section: 'security' },
  { label: 'Change Password', route: '/(tabs)/settings/password', section: 'security' },
  { label: 'Lock Wallet', route: '/(tabs)/settings/lock', section: 'security' },
  { label: 'Server', route: '/(tabs)/settings/server', section: 'advanced' },
  { label: 'Coin Control (VTXOs)', route: '/(tabs)/settings/vtxos', section: 'advanced' },
  { label: 'Logs', route: '/(tabs)/settings/logs', section: 'advanced' },
  { label: 'About', route: '/(tabs)/settings/about', section: 'general' },
  { label: 'Reset Wallet', route: '/(tabs)/settings/reset', section: 'security' },
]

export default function SettingsIndex() {
  const renderSection = (title: string, section: string) => {
    const items = menuItems.filter((i) => i.section === section)
    if (items.length === 0) return null
    return (
      <View key={section} style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item) => (
          <Pressable
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={[styles.menuLabel, item.label === 'Reset Wallet' && styles.danger]}>
              {item.label}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Text style={styles.title}>Settings</Text>
        {renderSection('Security', 'security')}
        {renderSection('Advanced', 'advanced')}
        {renderSection('General', 'general')}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  menuLabel: { fontSize: 16, color: '#fff' },
  chevron: { fontSize: 20, color: '#888' },
  danger: { color: '#ef4444' },
})
