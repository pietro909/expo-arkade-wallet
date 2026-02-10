import { useContext, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { WalletContext } from '@/providers/wallet'
import { ConfigContext } from '@/providers/config'
import { AspContext } from '@/providers/asp'

export default function IndexRedirect() {
  const { walletLoaded, initialized, wallet } = useContext(WalletContext)
  const { configLoaded } = useContext(ConfigContext)
  const { aspInfo } = useContext(AspContext)

  useEffect(() => {
    if (!walletLoaded || !configLoaded) return

    if (aspInfo.unreachable) {
      // Stay on loading — server unreachable
      return
    }

    if (!wallet.pubkey) {
      router.replace('/onboarding')
      return
    }

    if (!initialized) {
      router.replace('/unlock')
      return
    }

    router.replace('/(tabs)')
  }, [walletLoaded, configLoaded, initialized, wallet.pubkey, aspInfo.unreachable])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
