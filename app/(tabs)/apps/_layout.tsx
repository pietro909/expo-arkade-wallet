import { Stack } from 'expo-router'

export default function AppsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="boltz/index" />
      <Stack.Screen name="boltz/settings" />
      <Stack.Screen name="boltz/[swapId]" />
    </Stack>
  )
}
