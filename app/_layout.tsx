// MUST be first import — polyfill crypto.getRandomValues for React Native
import * as Crypto from 'expo-crypto'

if (!global.crypto?.getRandomValues) {
  if (!global.crypto) global.crypto = {} as any
  // @ts-ignore
  global.crypto.getRandomValues = Crypto.getRandomValues
}

import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useContext, useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import 'react-native-reanimated'

import { ConfigProvider } from '@/providers/config'
import { AspProvider } from '@/providers/asp'
import { NotificationsProvider } from '@/providers/notifications'
import { FiatProvider } from '@/providers/fiat'
import { FlowProvider } from '@/providers/flow'
import { WalletProvider, WalletContext } from '@/providers/wallet'
import { LightningProvider } from '@/providers/lightning'
import { LimitsProvider } from '@/providers/limits'
import { FeesProvider } from '@/providers/fees'
import { OptionsProvider } from '@/providers/options'
import { NudgeProvider } from '@/providers/nudge'
import { AnnouncementProvider } from '@/providers/announcements'

function RootNavigator() {
  const { walletLoaded, wallet, initialized } = useContext(WalletContext)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!walletLoaded) return

    const inTabs = segments[0] === '(tabs)'
    const inOnboarding = segments[0] === 'onboarding'
    const inUnlock = segments[0] === 'unlock'

    if (!wallet.network) {
      // No wallet created yet — go to onboarding
      if (!inOnboarding) router.replace('/onboarding')
    } else if (!initialized) {
      // Wallet exists but locked — go to unlock
      if (!inUnlock) router.replace('/unlock')
    } else {
      // Wallet is initialized — go to tabs
      if (!inTabs) router.replace('/(tabs)')
    }
  }, [walletLoaded, wallet.network, initialized])

  if (!walletLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="unlock" />
        <Stack.Screen name="send" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}

export default function RootLayout() {
  return (
    <ConfigProvider>
      <AspProvider>
        <NotificationsProvider>
          <FiatProvider>
            <FlowProvider>
              <WalletProvider>
                <LightningProvider>
                  <LimitsProvider>
                    <FeesProvider>
                      <OptionsProvider>
                        <NudgeProvider>
                          <AnnouncementProvider>
                            <RootNavigator />
                          </AnnouncementProvider>
                        </NudgeProvider>
                      </OptionsProvider>
                    </FeesProvider>
                  </LimitsProvider>
                </LightningProvider>
              </WalletProvider>
            </FlowProvider>
          </FiatProvider>
        </NotificationsProvider>
      </AspProvider>
    </ConfigProvider>
  )
}
