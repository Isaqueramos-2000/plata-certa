import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config pra testes unitários puros (lógica de negócio).
 *
 * Componentes e telas RN não rodam aqui — eles dependem do runtime
 * do React Native, que o Vitest não polifila. Pra testar UI, o caminho
 * é Maestro/Playwright em E2E. Aqui ficam só funções puras e stores.
 *
 * Mocks de `react-native` e AsyncStorage estão em __tests__/setup.ts.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    include: ['__tests__/**/*.test.ts'],
  },
});
