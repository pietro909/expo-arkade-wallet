import { Stack } from 'expo-router'

export default function ReceiveLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="amount" />
      <Stack.Screen name="qrcode" />
      <Stack.Screen name="success" />
    </Stack>
  )
}
