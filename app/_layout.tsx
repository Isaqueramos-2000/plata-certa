import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/lib/theme';
import { MOCK_IDENTIFICATIONS } from '@/assets/mocks/identifications';
import { SEED_VERSION } from '@/assets/mocks/seed-cache';
import { setupNotifications } from '@/services/notifications';
import { seedCacheIfNeeded } from '@/services/speciesCache';
import { useGardenStore } from '@/stores/gardenStore';
import { useIdentificationStore } from '@/stores/identificationStore';
import { useQuestionsStore } from '@/stores/questionsStore';
import { useHasHydrated, useSettingsStore } from '@/stores/settingsStore';

import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash já está fechada — ignore. */
});

const PlantaCertaLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.sage,
    background: colors.cream,
    card: colors.cream,
    text: colors.ink,
    border: colors.creamDark,
    notification: colors.terracotta,
  },
};

const PlantaCertaDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.sageLight,
    background: colors.sageDark,
    card: colors.sageDark,
    text: colors.cream,
    border: colors.sage,
    notification: colors.terracottaLight,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hasHydrated = useHasHydrated();

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Espera tanto as fontes quanto a hidratação do Zustand antes de
  // fechar o splash, evitando flash de texto sem estilo.
  const ready = (fontsLoaded || !!fontError) && hasHydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Popula o cache de espécies com o bundle no primeiro launch (e em
  // updates do bundle quando SEED_VERSION mudar). É idempotente.
  useEffect(() => {
    seedCacheIfNeeded(SEED_VERSION).catch(() => {});
    // Configura o handler global e o canal Android pra notificações.
    // No-op silencioso no web.
    setupNotifications().catch(() => {});
  }, []);

  // Expõe stores no window em dev pra debug rápido no DevTools e testes
  // headless (não fica no bundle de produção).
  if (__DEV__ && typeof window !== 'undefined') {
    (window as { __plantDev?: unknown }).__plantDev = {
      stores: {
        identification: useIdentificationStore,
        questions: useQuestionsStore,
        settings: useSettingsStore,
        garden: useGardenStore,
      },
      mocks: MOCK_IDENTIFICATIONS,
    };
  }

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === 'dark' ? PlantaCertaDarkTheme : PlantaCertaLightTheme}
      >
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.cream },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen
            name="result"
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="plant/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="add-to-garden"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="article/[id]"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
