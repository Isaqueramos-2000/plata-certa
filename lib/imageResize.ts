import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Reduz a imagem capturada antes de:
 *   1. mandar pro Claude (corta ~60% dos tokens de visão)
 *   2. salvar no AsyncStorage (URLs `blob:` do web não persistem entre
 *      sessões — convertendo pra base64 vira string portátil)
 *
 * 768×768 com qualidade 0.7 é suficiente pra identificação confiável
 * de plantas; mais que isso é desperdício.
 */

const MAX_DIMENSION = 768;
const QUALITY = 0.7;

export type ResizedImage = {
  /** data:image/jpeg;base64,... — URI portátil que persiste no storage e renderiza em <Image>. */
  uri: string;
  /** Apenas o base64 cru, sem prefixo, pra mandar pro Claude. */
  base64: string;
  /** Sempre 'image/jpeg' depois do resize — simplifica o downstream. */
  mimeType: 'image/jpeg';
};

/**
 * Recebe uma URI vinda do `expo-image-picker` (file://, blob:, content://)
 * e devolve uma versão menor + base64 + data-URI estável.
 */
export async function resizeForUpload(sourceUri: string): Promise<ResizedImage> {
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64) {
    throw new Error('Falha ao gerar base64 da imagem.');
  }

  return {
    uri: `data:image/jpeg;base64,${result.base64}`,
    base64: result.base64,
    mimeType: 'image/jpeg',
  };
}
