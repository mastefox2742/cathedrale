import { type ReactNode } from 'react'
import { View, ScrollView, StyleSheet, type ViewStyle } from 'react-native'
import { colors } from '../theme/colors'

interface ScreenProps {
  children: ReactNode
  scroll?: boolean
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}

export function Screen({ children, scroll = true, style, contentContainerStyle }: ScreenProps) {
  if (!scroll) {
    return <View style={[styles.root, style]}>{children}</View>
  }
  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
})
