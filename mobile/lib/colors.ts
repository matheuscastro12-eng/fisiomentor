/**
 * Color constants matching the Clinical Curator design system
 */

export const colors = {
  // Surface colors
  surface: '#061423',
  surfaceContainer: '#0a1f33',
  surfaceContainerHigh: '#0f2b45',

  // Primary colors
  primary: '#42dec3',
  onPrimary: '#061423',

  // Status colors
  error: '#ff6b6b',
  warning: '#ffa726',
  success: '#66bb6a',

  // Text colors
  onSurface: '#e8eef4',
  onSurfaceVariant: '#8b9db3',

  // Additional semantic colors
  info: '#42a5f5',
  critical: '#d32f2f',

  // Neutral scale
  neutral: {
    50: '#f5f5f5',
    100: '#eeeeee',
    200: '#e0e0e0',
    300: '#bdbdbd',
    400: '#9e9e9e',
    500: '#757575',
    600: '#616161',
    700: '#424242',
    800: '#212121',
    900: '#121212',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Transparent variants
  primaryAlpha: {
    10: '#42dec31a',
    20: '#42dec333',
    30: '#42dec34d',
    40: '#42dec366',
    50: '#42dec380',
  },
} as const;

export type ColorKey = keyof typeof colors;

/**
 * Get a color by key with optional opacity adjustment
 */
export const getColor = (colorKey: ColorKey, opacity?: number): string => {
  const color = colors[colorKey];
  if (typeof color === 'string') {
    if (opacity !== undefined && opacity < 1) {
      // Convert hex to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }
  return '#000000';
};
