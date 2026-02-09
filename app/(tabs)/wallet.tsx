import { Image } from 'expo-image';
import {Button, Platform, StyleSheet} from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

import { Wallet, SingleKey } from '@arkade-os/sdk'
import { ExpoArkProvider, ExpoIndexerProvider } from '@arkade-os/sdk/adapters/expo'
import { AsyncStorageAdapter } from '@arkade-os/sdk/adapters/asyncStorage'
import {useEffect, useState} from "react";



export default function HomeScreen() {
  const [isCreating, setIsCreating] = useState(false);

  async function createNewWallet() {

    // Setup storage
    const storage = new AsyncStorageAdapter()

    // // Load or create identity
    let privateKeyHex = await storage.getItem('private-key')
    if (!privateKeyHex) {
      const newIdentity = SingleKey.fromRandomBytes()
      // privateKeyHex = newIdentity.toHex()
      // await storage.setItem('private-key', privateKeyHex)
    }
    //
    // const identity = SingleKey.fromHex(privateKeyHex)
    //
    // // Create wallet with Expo providers
    // const wallet = await Wallet.create({
    //   identity,
    //   esploraUrl: 'https://mutinynet.com/api',
    //   arkProvider: new ExpoArkProvider('https://mutinynet.arkade.sh'),
    //   indexerProvider: new ExpoIndexerProvider('https://mutinynet.arkade.sh'),
    //   storage
    // })
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Wallet playground</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">1 - Create a Wallet</ThemedText>
        <ThemedText>
          Tap to create a <ThemedText type="defaultSemiBold">new Arkade wallet</ThemedText>.
        </ThemedText>
        <Button title={"Create"} disabled={isCreating} onPress={() => {
          setIsCreating(true)
          createNewWallet().finally(() => setIsCreating(false))
        }} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
