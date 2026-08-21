import { type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, fonts, radius } from '../theme/colors'
import { Icon } from './Icon'

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const content = (
    <View style={[cardStyles.card, style]}>{children}</View>
  )
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {content}
      </Pressable>
    )
  }
  return content
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
})

export function Badge({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <View style={[badgeStyles.badge, { backgroundColor: background }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  )
}

const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
})

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: import('./Icon').IconName }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.chip,
        active ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
      ]}
    >
      {icon && <Icon name={icon} size={13} color={active ? colors.primaryForeground : colors.mutedForeground} />}
      <Text style={[chipStyles.text, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  )
}

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full },
  text: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
})

export function PrimaryButton({ label, onPress, icon, disabled }: { label: string; onPress?: () => void; icon?: import('./Icon').IconName; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyles.button,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={buttonStyles.text}>{label}</Text>
      {icon && <Icon name={icon} size={16} color={colors.primaryForeground} />}
    </Pressable>
  )
}

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
  },
  text: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },
})

export function BackHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigation = useNavigation()
  return (
    <View style={headerStyles.row}>
      <Pressable onPress={() => navigation.goBack()} style={headerStyles.backBtn}>
        <Icon name="arrow-left" size={20} color={colors.primary} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={headerStyles.title}>{title}</Text>
        {subtitle && <Text style={headerStyles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  )
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(217,224,229,0.4)' },
  backBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 19, color: colors.primary },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
})
