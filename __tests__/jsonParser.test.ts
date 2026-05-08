import { describe, expect, it } from 'vitest';

import { parseAndValidate, type ParseError } from '@/services/jsonParser';

describe('parseAndValidate', () => {
  it('faz parse de JSON puro e retorna o objeto', () => {
    const raw = '{"identified":true,"scientificName":"Monstera deliciosa"}';
    const result = parseAndValidate<{ scientificName: string }>(raw, ['scientificName']);
    expect(result.scientificName).toBe('Monstera deliciosa');
  });

  it('limpa cercas markdown ```json ... ```', () => {
    const raw = '```json\n{"identified":true,"scientificName":"X"}\n```';
    const result = parseAndValidate<{ scientificName: string }>(raw, ['scientificName']);
    expect(result.scientificName).toBe('X');
  });

  it('limpa cercas markdown ``` ... ``` sem língua', () => {
    const raw = '```\n{"identified":true,"scientificName":"Y"}\n```';
    const result = parseAndValidate<{ scientificName: string }>(raw, ['scientificName']);
    expect(result.scientificName).toBe('Y');
  });

  it('descarta texto antes e depois do objeto principal', () => {
    const raw =
      'Aqui está a identificação:\n\n{"identified":true,"scientificName":"Z"}\n\nEspero ter ajudado!';
    const result = parseAndValidate<{ scientificName: string }>(raw, ['scientificName']);
    expect(result.scientificName).toBe('Z');
  });

  it('lança erro malformed quando JSON é inválido', () => {
    let captured: ParseError | null = null;
    try {
      parseAndValidate('isso não é JSON', ['x']);
    } catch (err) {
      captured = err as ParseError;
    }
    expect(captured?.kind).toBe('malformed');
    expect(captured?.message).toMatch(/Não consegui interpretar/);
  });

  it('lança erro quando faltam campos obrigatórios', () => {
    let captured: ParseError | null = null;
    try {
      parseAndValidate('{"identified":true}', ['scientificName']);
    } catch (err) {
      captured = err as ParseError;
    }
    expect(captured?.kind).toBe('malformed');
    expect(captured?.message).toMatch(/scientificName/);
  });

  it('aceita JSON aninhado e valida só o nível raiz', () => {
    const raw =
      '{"care":{"light":"sol pleno"},"scientificName":"X","identified":true}';
    const result = parseAndValidate<{ care: { light: string } }>(raw, [
      'care',
      'scientificName',
    ]);
    expect(result.care.light).toBe('sol pleno');
  });
});
