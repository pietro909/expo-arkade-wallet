import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="backup" />
      <Stack.Screen name="password" />
      <Stack.Screen name="server" />
      <Stack.Screen name="lock" />
      <Stack.Screen name="reset" />
      <Stack.Screen name="vtxos" />
      <Stack.Screen name="about" />
      <Stack.Screen name="logs" />
    </Stack>
  )
}
