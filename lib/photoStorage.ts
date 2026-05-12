/**
 * Armazenamento permanente de fotos usando expo-file-system.
 *
 * Por que isso existe?
 * ───────────────────
 * Antes, as fotos eram salvas como data: URLs (base64) direto no AsyncStorage.
 * Isso funciona, mas AsyncStorage tem limite de ~6 MB no Android. Com muitas
 * plantas e fotos extras, o storage transborda e dados são perdidos silenciosamente.
 *
 * Solução: salvar o arquivo binário no diretório do app (documentDirectory) e
 * guardar apenas o path no AsyncStorage. Uma foto de 768×768 JPEG ≈ 100-150 KB
 * no filesystem vs ≈ 200 KB como base64 no AsyncStorage.
 *
 * No web, expo-file-system não tem suporte completo — data: URLs continuam
 * sendo usadas nessa plataforma (localStorage aguenta bem para o caso de uso web).
 *
 * Compatibilidade retroativa: URIs do formato antigo (data: URLs) são retornados
 * sem alteração por resolvePhotoUri, então plantas existentes continuam funcionando.
 */

// expo-file-system v18+ separa a API legada em um subpath
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const PHOTOS_DIR = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}plantacerta/photos/`
  : null;

// ─── Salvar ───────────────────────────────────────────────────────────────────

/**
 * Salva uma foto no filesystem e retorna o path permanente.
 *
 * @param source  data: URL (base64) ou file:// URI
 * @param photoId Identificador único (ex: Date.now() ou uuid)
 * @returns Path permanente (file://) no mobile, ou a source original no web
 */
export async function savePhoto(source: string, photoId: string): Promise<string> {
  // Web: filesystem não disponível — mantém data: URL no localStorage
  if (Platform.OS === 'web' || !PHOTOS_DIR) return source;

  await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  const dest = `${PHOTOS_DIR}${photoId}.jpg`;

  if (source.startsWith('data:')) {
    // Extrai o conteúdo base64 e escreve como arquivo binário
    const base64 = source.split(',')[1] ?? '';
    await FileSystem.writeAsStringAsync(dest, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else if (source.startsWith('file://') || source.startsWith('/')) {
    // URI nativo (câmera do dispositivo) — copia para o diretório do app
    await FileSystem.copyAsync({ from: source, to: dest });
  } else {
    // Formato desconhecido — retorna como está
    return source;
  }

  return dest;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolve um URI de foto para exibição.
 *
 * Lida com os três formatos possíveis:
 *   - data: URL (formato legado, salvo antes desta versão)
 *   - file:// path (formato novo após esta versão)
 *   - string vazia ou URI inexistente
 *
 * @returns URI válido para <Image source={{ uri }} />, ou string vazia se o
 *          arquivo não existir (ex: após reinstalação do app no iOS).
 */
export async function resolvePhotoUri(uri: string): Promise<string> {
  if (!uri) return '';

  // Web, data: URLs e URLs HTTP não precisam de resolução
  if (Platform.OS === 'web') return uri;
  if (uri.startsWith('data:') || uri.startsWith('http')) return uri;

  // Verifica se o arquivo existe no filesystem
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : '';
  } catch {
    return '';
  }
}

// ─── Limpar ───────────────────────────────────────────────────────────────────

/**
 * Remove a foto do filesystem quando a planta é deletada.
 * No-op silencioso para data: URLs e no web.
 */
export async function deletePhoto(uri: string): Promise<void> {
  if (Platform.OS === 'web' || !uri || uri.startsWith('data:') || uri.startsWith('http')) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Falha silenciosa — se não conseguiu deletar, não é crítico
  }
}

/**
 * Gera um ID único para nomear o arquivo de foto.
 */
export function generatePhotoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
