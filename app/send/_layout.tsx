import { Stack } from 'expo-router'

export default function SendLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="form" />
      <Stack.Screen name="details" />
      <Stack.Screen name="success" />
    </Stack>
  )
}
