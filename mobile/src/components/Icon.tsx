import Svg, { Path } from 'react-native-svg'
import type { StyleProp, ViewStyle } from 'react-native'
import { ICON_PATHS } from '../theme/icon-paths'

export type IconName = keyof typeof ICON_PATHS

interface IconProps {
  name: IconName
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

export function Icon({ name, size = 20, color = 'currentColor', style }: IconProps) {
  const def = ICON_PATHS[name]
  if (!def) return null
  return (
    <Svg width={size} height={size} viewBox={def.viewBox} style={style}>
      {def.paths.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill === 'currentColor' ? color : p.fill} />
      ))}
    </Svg>
  )
}
