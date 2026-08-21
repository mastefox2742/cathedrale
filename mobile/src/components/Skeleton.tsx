import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { colors, radius } from '../theme/colors'

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const pulse = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return <Animated.View style={[styles.block, style, { opacity: pulse }]} />
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonBlock style={{ width: 90, height: 20, borderRadius: radius.full }} />
        <SkeletonBlock style={{ width: 50, height: 14 }} />
      </View>
      <SkeletonBlock style={{ width: '80%', height: 18, marginBottom: 8 }} />
      <SkeletonBlock style={{ width: '100%', height: 13, marginBottom: 6 }} />
      <SkeletonBlock style={{ width: '60%', height: 13 }} />
    </View>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  )
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonBlock style={{ width: 46, height: 46, borderRadius: radius.md }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock style={{ width: '40%', height: 11 }} />
        <SkeletonBlock style={{ width: '85%', height: 14 }} />
        <SkeletonBlock style={{ width: '55%', height: 11 }} />
      </View>
    </View>
  )
}

export function SkeletonRowList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, borderRadius: radius.sm },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
})
