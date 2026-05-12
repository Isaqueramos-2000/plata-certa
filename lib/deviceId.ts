/**
 * UUID estável por instalação do app.
 *
 * Gerado na primeira abertura e persistido no AsyncStorage.
 * Enviado como header `X-Device-ID` em cada chamada ao backend,
 * permitindo rate limiting por dispositivo sem exigir login.
 *
 * Não é um identificador pessoal — é apenas um UUID aleatório que
 * distingue instalações entre si para controle de uso.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'plantacerta:deviceId';

// Cache em memória para evitar I/O a cada chamada
let _cachedId: string | null = null;

/**
 * Retorna o UUID desta instalação. Cria um novo se for o primeiro acesso.
 */
export async function getDeviceId(): Promise<string> {
  if (_cachedId) return _cachedId;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      _cachedId = stored;
      return stored;
    }
  } catch {
    // AsyncStorage pode falhar em ambientes de teste — gera ID temporário
  }

  const id = generateUUID();
  _cachedId = id;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Se não conseguir persistir, usa o ID em memória por essa sessão
  }

  return id;
}

/**
 * UUID v4 sem depender de `crypto` (compatível com Hermes/JSC).
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
