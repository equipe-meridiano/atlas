import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink, Button, Contours, Skeleton } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { PlaceNotFound } from '@/components/PlaceNotFound';
import { placeFromParams } from '@/data/place';
import { dayLabel, formatLocalTime, formatRange, formatTemperature, formatWind } from '@/lib/format';
import type { Forecast } from '@/lib/openMeteo';
import { useRetryListener } from '@/lib/retry';
import { useForecast } from '@/lib/useForecast';
import { useOfflineRedirect } from '@/lib/useOfflineRedirect';
import { describeWeather } from '@/lib/weatherCodes';
import { colors, displayMaxScale, screenPadding, type } from '@/theme';

/** 05 / Clima do destino. */
export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const place = placeFromParams(useLocalSearchParams());
  const { state, refresh } = useForecast(place);

  useRetryListener('clima', refresh);
  useOfflineRedirect(state.status === 'offline' ? state : null, 'clima');

  if (!place) return <PlaceNotFound />;

  const forecast = state.status === 'success' ? state.forecast : null;

  return (
    <View style={styles.screen}>
      <FocusStatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 10) + 16 },
        ]}
      >
        <BackLink color={colors.white} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[type.cityLight, styles.white, styles.city]}>
          {place.name}
        </Text>
        <Text style={[type.body, styles.ice, styles.caption]}>Previsão do tempo</Text>

        <View style={styles.now}>
          {/* As curvas vão até a borda direita da tela, como no Figma. */}
          <Contours variant="clima" style={styles.contours} />
          <CurrentWeather state={state.status} forecast={forecast} />
        </View>

        <Text accessibilityRole="header" style={[type.cardTitle, styles.white, styles.daysTitle]}>
          Próximos dias
        </Text>
        <View style={styles.days}>
          {forecast
            ? forecast.days.map((day, index) => (
                <View
                  key={day.date}
                  style={styles.dayRow}
                  accessible
                  accessibilityLabel={`${dayLabel(day.date, index)}: mínima ${formatTemperature(day.min)}, máxima ${formatTemperature(day.max)}, ${describeWeather(day.weatherCode)}`}
                >
                  <Text style={[type.body, styles.ice, styles.dayLabel]}>{dayLabel(day.date, index)}</Text>
                  <Text style={[type.bodyLargeMedium, styles.white, styles.dayValue]}>
                    {formatRange(day.min, day.max)}
                  </Text>
                </View>
              ))
            : [0, 1, 2].map((index) => (
                <View key={index} style={styles.dayRow}>
                  <Skeleton tone="dark" style={styles.dayLabelSkeleton} />
                  <Skeleton tone="dark" style={styles.dayValueSkeleton} />
                </View>
              ))}
        </View>

        <Text style={[type.caption, styles.ice, styles.source]}>
          {forecast
            ? `Dados: Open-Meteo.\nHorário local da leitura: ${formatLocalTime(forecast.time)}.`
            : 'Dados: Open-Meteo.\nBuscando a previsão mais recente.'}
        </Text>
        <Button label="Atualizar previsão" onPress={refresh} style={styles.button} />
      </ScrollView>
    </View>
  );
}

type CurrentProps = { state: 'loading' | 'success' | 'offline' | 'error'; forecast: Forecast | null };

/** Temperatura, condição e sensação. Enquanto carrega, blocos do mesmo tamanho. */
function CurrentWeather({ state, forecast }: CurrentProps) {
  if (forecast) {
    return (
      <View accessible accessibilityLabel={`Agora: ${formatTemperature(forecast.temperature)}, ${describeWeather(forecast.weatherCode)}`}>
        <Text style={[type.temperature, styles.white]} maxFontSizeMultiplier={displayMaxScale}>
          {formatTemperature(forecast.temperature)}
        </Text>
        <Text style={[type.condition, styles.white, styles.condition]}>
          {describeWeather(forecast.weatherCode)}
        </Text>
        <Text style={[type.small, styles.ice, styles.feels]}>
          {`Sensação de ${formatTemperature(forecast.apparentTemperature)} / vento ${formatWind(forecast.windSpeed)}`}
        </Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View accessibilityLiveRegion="polite">
        <Text style={[type.temperature, styles.white]} maxFontSizeMultiplier={displayMaxScale}>
          –
        </Text>
        <Text style={[type.condition, styles.white, styles.condition]}>Não foi possível ler a previsão.</Text>
        <Text style={[type.small, styles.ice, styles.feels]}>Toque em “Atualizar previsão” para tentar de novo.</Text>
      </View>
    );
  }

  return (
    <View accessible accessibilityLabel="Carregando a previsão">
      <Skeleton tone="dark" style={styles.tempSkeleton} />
      <Skeleton tone="dark" style={styles.conditionSkeleton} />
      <Skeleton tone="dark" style={styles.feelsSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: screenPadding },
  white: { color: colors.white },
  ice: { color: colors.ice },
  city: { marginTop: 29 },
  caption: { marginTop: 9 },
  now: { marginTop: 33 },
  contours: { position: 'absolute', top: -22, right: -screenPadding },
  condition: { marginTop: 10 },
  feels: { marginTop: 16 },
  tempSkeleton: { height: 132, width: 170, borderRadius: 12 },
  conditionSkeleton: { marginTop: 10, height: 24, width: 210, borderRadius: 6 },
  feelsSkeleton: { marginTop: 16, height: 18, width: 230, borderRadius: 6 },
  daysTitle: { marginTop: 48 },
  days: { marginTop: 26, gap: 32 },
  dayRow: { flexDirection: 'row', alignItems: 'center', minHeight: 22 },
  dayLabel: { flex: 1 },
  dayValue: { width: 120 },
  dayLabelSkeleton: { flex: 1, maxWidth: 90, height: 19, borderRadius: 6 },
  dayValueSkeleton: { marginLeft: 'auto', width: 120, height: 22, borderRadius: 6 },
  source: { marginTop: 52 },
  button: { marginTop: 28 },
});
