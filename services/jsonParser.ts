/**
 * Parser defensivo de JSON vindo do Claude. Modelos às vezes embrulham
 * o JSON em cercas markdown (```json...```) ou adicionam frases de
 * cortesia antes/depois. Esta função:
 *
 *  1. Remove cercas markdown se existirem
 *  2. Recorta o objeto principal entre `{` e `}` (descarta texto fora)
 *  3. Faz `JSON.parse`
 *  4. Valida que os campos obrigatórios estão presentes
 *
 * Erros viram um Error com `kind = 'malformed'` que a UI sabe traduzir.
 */
export function parseAndValidate<T>(raw: string, requiredFields: string[]): T {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw makeError('malformed', 'Não consegui interpretar a resposta. Tente novamente.');
  }
  for (const f of requiredFields) {
    if (!(f in parsed)) {
      throw makeError('malformed', `Resposta incompleta da API (faltou "${f}").`);
    }
  }
  return parsed as T;
}

type ParseErrorKind = 'malformed';

export type ParseError = Error & { kind: ParseErrorKind };

function makeError(kind: ParseErrorKind, message: string): ParseError {
  const err = new Error(message) as ParseError;
  err.kind = kind;
  return err;
}
