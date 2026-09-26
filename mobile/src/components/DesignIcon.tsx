import { SvgXml } from 'react-native-svg'
import type { StyleProp, ViewStyle } from 'react-native'
import { DESIGN_ICONS, type DesignIconName } from '../theme/design-icons'

/** Icône de la maquette archidiocèse, rendue à partir du SVG d'origine. */
export function DesignIcon({ name, size = 20, color = '#123B5D', style }: {
  name: DesignIconName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}) {
  return <SvgXml xml={DESIGN_ICONS[name]} width={size} height={size} color={color} style={style} />
}
