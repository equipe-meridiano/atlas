import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router/js-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FavoritesProvider } from '@/lib/favorites';
import { durations, useReduceMotion } from '@/lib/motion';
import { cardToDestination, dissolve } from '@/lib/transitions';
import { colors } from '@/theme';

// Mantém a tela de abertura até as fontes carregarem, para o texto não "piscar".
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold });
  const reduceMotion = useReduceMotion();
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FavoritesProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.paper },
              ...dissolve(durations.navegacao, reduceMotion),
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(abas)" options={dissolve(durations.entrada, reduceMotion)} />
            <Stack.Screen name="destino" options={cardToDestination(reduceMotion)} />
            <Stack.Screen name="clima" />
            <Stack.Screen name="sem-conexao" options={{ gestureEnabled: false }} />
          </Stack>
        </FavoritesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
