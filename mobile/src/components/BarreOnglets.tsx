import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { DesignIcon } from './DesignIcon'
import type { DesignIconName } from '../theme/design-icons'
import { d, f } from '../theme/design'

/** Barre de navigation des maquettes Archidiocèse (claire ; sombre sur l'écran TV). */

const ONGLETS: Record<string, { label: string; icone: DesignIconName; actif: DesignIconName }> = {
  Accueil: { label: 'Accueil', icone: 'solar:home-2-linear', actif: 'solar:home-2-bold' },
  TV: { label: 'TV / Média', icone: 'solar:play-circle-linear', actif: 'solar:play-circle-bold' },
  Parcours: { label: 'Parcours', icone: 'solar:compass-linear', actif: 'solar:compass-bold' },
  Prier: { label: 'Prier', icone: 'solar:heart-linear', actif: 'solar:heart-bold' },
  Plus: { label: 'Plus', icone: 'solar:menu-dots-linear', actif: 'solar:menu-dots-bold' },
}

export function BarreOnglets({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const sombre = state.routes[state.index]?.name === 'TV'

  return (
    <View style={[s.barre, sombre && s.barreSombre, { paddingBottom: 8 + insets.bottom }]}>
      {state.routes.map((route, i) => {
        const def = ONGLETS[route.name]
        const actif = state.index === i
        const couleur = actif ? (sombre ? d.accent : d.primary) : (sombre ? d.alpha(d.white, 0.6) : d.mutedForeground)
        function appuyer() {
          const evt = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!actif && !evt.defaultPrevented) navigation.navigate(route.name, route.params)
        }
        return (
          <Pressable key={route.key} onPress={appuyer} style={s.bouton} accessibilityRole="tab" accessibilityState={{ selected: actif }} accessibilityLabel={def.label}>
            <DesignIcon name={actif ? def.actif : def.icone} size={22} color={couleur} />
            <Text style={[s.label, { color: couleur, fontFamily: actif ? f.bold : f.semibold }]}>{def.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  barre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 8, paddingHorizontal: 4,
    backgroundColor: d.alpha(d.card, 0.95), borderTopWidth: 1, borderTopColor: d.border,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  barreSombre: { backgroundColor: d.alpha(d.ink, 0.95), borderTopColor: d.alpha(d.white, 0.1) },
  bouton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  label: { fontSize: 10 },
})
