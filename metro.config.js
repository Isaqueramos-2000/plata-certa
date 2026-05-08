const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Zustand's package.json `exports` aponta para .mjs no web, e o
// arquivo .mjs usa `import.meta.env` — sintaxe inválida em script
// clássico, fazendo o bundle web falhar silenciosamente. Desligando
// o package-exports forçamos a resolução pelo `main` (CJS), que é
// equivalente em comportamento e válido no Metro.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
