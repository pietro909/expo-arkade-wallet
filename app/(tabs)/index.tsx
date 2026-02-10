import { useContext } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WalletContext } from '@/providers/wallet'
import { ConfigContext } from '@/providers/config'
import { FiatContext } from '@/providers/fiat'
import { AspContext } from '@/providers/asp'
import { FlowContext, emptyRecvInfo, emptySendInfo } from '@/providers/flow'
import { prettyNumber, prettyHide, prettyAgo } from '@/lib/format'
import { CurrencyDisplay, Tx } from '@/lib/types'

export default function WalletHome() {
  const { balance, txs, initialized } = useContext(WalletContext)
  const { config, updateConfig } = useContext(ConfigContext)
  const { toFiat } = useContext(FiatContext)
  const { aspInfo } = useContext(AspContext)
  const { setRecvInfo, setSendInfo, setTxInfo } = useContext(FlowContext)

  if (!initialized) return null

  const showBalance = config.showBalance
  const fiatAmount = toFiat(balance)
  const fiatSymbol = config.fiat

  const toggleShowBalance = () => {
    updateConfig({ ...config, showBalance: !showBalance })
  }

  const handleSend = () => {
    setSendInfo(emptySendInfo)
    router.push('/send/form')
  }

  const handleReceive = () => {
    setRecvInfo(emptyRecvInfo)
    router.push('/receive/amount')
  }

  const handleTxPress = (tx: Tx) => {
    setTxInfo(tx)
    // TODO: navigate to tx detail when built
  }

  const renderBalanceMain = () => {
    if (!showBalance) return prettyHide(balance, 'SATS')
    return `${prettyNumber(balance)} SATS`
  }

  const renderBalanceSecondary = () => {
    if (!showBalance) return prettyHide(fiatAmount, fiatSymbol)
    if (config.currencyDisplay === CurrencyDisplay.Sats) return null
    return `${prettyNumber(fiatAmount, 2)} ${fiatSymbol}`
  }

  const renderTxItem = ({ item: tx }: { item: Tx }) => {
    const isReceived = tx.type === 'received'
    const prefix = isReceived ? '+' : '-'
    const color = tx.preconfirmed ? '#f59e0b' : isReceived ? '#22c55e' : '#fff'
    const statusText = tx.preconfirmed
      ? 'Unconfirmed'
      : tx.createdAt
        ? prettyAgo(tx.createdAt)
        : ''

    return (
      <Pressable style={styles.txRow} onPress={() => handleTxPress(tx)}>
        <View style={styles.txLeft}>
          <Text style={styles.txType}>{isReceived ? 'Received' : 'Sent'}</Text>
          <Text style={styles.txDate}>{statusText}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color }]}>
            {showBalance ? `${prefix}${prettyNumber(tx.amount)} SATS` : prettyHide(tx.amount)}
          </Text>
          {showBalance && config.currencyDisplay !== CurrencyDisplay.Sats && (
            <Text style={styles.txFiat}>
              {prettyNumber(toFiat(tx.amount), 2)} {fiatSymbol}
            </Text>
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {aspInfo.unreachable && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Server unreachable</Text>
        </View>
      )}

      <Pressable style={styles.balanceContainer} onPress={toggleShowBalance}>
        <Text style={styles.balanceLabel}>My balance</Text>
        <Text style={styles.balance}>{renderBalanceMain()}</Text>
        {renderBalanceSecondary() && (
          <Text style={styles.balanceSecondary}>{renderBalanceSecondary()}</Text>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleSend}>
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionLabel}>Send</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleReceive}>
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionLabel}>Receive</Text>
        </Pressable>
      </View>

      <View style={styles.txSection}>
        <Text style={styles.txHeader}>Transaction history</Text>
        {txs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Send or receive bitcoin to get started</Text>
          </View>
        ) : (
          <FlatList
            data={txs}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderTxItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  errorBanner: {
    backgroundColor: '#ef4444',
    padding: 8,
    alignItems: 'center',
  },
  errorBannerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  balanceContainer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  balanceLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
  balance: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  balanceSecondary: { fontSize: 16, color: '#888', marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  txSection: { flex: 1, paddingHorizontal: 20 },
  txHeader: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 16, fontWeight: '500' },
  emptySubtext: { color: '#666', fontSize: 14, marginTop: 4 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  txLeft: { gap: 2 },
  txType: { fontSize: 16, fontWeight: '500', color: '#fff' },
  txDate: { fontSize: 13, color: '#888' },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 16, fontWeight: '500' },
  txFiat: { fontSize: 13, color: '#888' },
})
