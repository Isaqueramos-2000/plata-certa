import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isNative = !isWeb;

/**
 * Roda um callback apenas em web. Útil para integrações DOM-only
 * (analytics, scroll listeners de window, etc.) sem espalhar checks
 * de Platform.OS pelo código.
 */
export function onlyOnWeb<T>(fn: () => T): T | undefined {
  return isWeb ? fn() : undefined;
}
