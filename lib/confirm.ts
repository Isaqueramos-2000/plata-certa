import { Alert, Platform } from 'react-native';

/**
 * Confirma uma ação destrutiva de forma cross-platform.
 *
 * O `Alert.alert` do React Native com array de botões funciona em
 * iOS/Android, mas no web o `react-native-web` traduz pra `window.alert()`
 * — que só tem botão OK e descarta o callback do botão destrutivo.
 *
 * Aqui usamos `window.confirm()` no web (modal nativo do navegador, com
 * dois botões) e `Alert.alert` em mobile.
 *
 * @returns true se o usuário confirmou; false se cancelou.
 */
export function confirmDestructive(
  title: string,
  message: string,
  destructiveLabel = 'Remover',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: destructiveLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
