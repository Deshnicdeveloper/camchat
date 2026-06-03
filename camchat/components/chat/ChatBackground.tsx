/**
 * ChatBackground
 * A subtle, tiled doodle pattern rendered behind the message list (WhatsApp
 * style). Theme-aware: warm off-white in light mode, deep slate in dark mode.
 */

import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect, Circle } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';

export function ChatBackground() {
  const { isDark } = useColors();

  // Base canvas + faint motif color
  const base = isDark ? '#0B141A' : '#ECE5DD';
  const motif = isDark ? '#1B2A33' : '#D9CFC2';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* A small repeating tile with a few soft marks */}
          <Pattern id="chatDoodle" width={64} height={64} patternUnits="userSpaceOnUse">
            <Circle cx={10} cy={10} r={2} fill={motif} />
            <Path
              d="M40 8 q6 6 0 12"
              stroke={motif}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M14 40 l8 0 M18 36 l0 8"
              stroke={motif}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Circle cx={48} cy={46} r={2} fill={motif} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#chatDoodle)" opacity={0.5} />
      </Svg>
    </View>
  );
}

export default ChatBackground;
