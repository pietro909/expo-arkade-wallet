// MUST be first import — polyfill crypto.getRandomValues for React Native
import * as Crypto from 'expo-crypto'

if (!global.crypto?.getRandomValues) {
  if (!global.crypto) global.crypto = {} as any
  // @ts-ignore
  global.crypto.getRandomValues = Crypto.getRandomValues
}

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { ConfigProvider } from '@/providers/config'
import { AspProvider } from '@/providers/asp'
import { NotificationsProvider } from '@/providers/notifications'
import { FiatProvider } from '@/providers/fiat'
import { FlowProvider } from '@/providers/flow'
import { WalletProvider } from '@/providers/wallet'
import { LightningProvider } from '@/providers/lightning'
import { LimitsProvider } from '@/providers/limits'
import { FeesProvider } from '@/providers/fees'
import { OptionsProvider } from '@/providers/options'
import { NudgeProvider } from '@/providers/nudge'
import { AnnouncementProvider } from '@/providers/announcements'

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
                            <Stack screenOptions={{ headerShown: false }}>
                              <Stack.Screen name="(tabs)" />
                              <Stack.Screen name="onboarding" />
                              <Stack.Screen name="unlock" />
                              <Stack.Screen name="send" options={{ presentation: 'modal' }} />
                              <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
                            </Stack>
                            <StatusBar style="auto" />
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
