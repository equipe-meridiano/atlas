import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, DestinationCard, DestinationCardSkeleton } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { placeToParams } from '@/data/place';
import { useFavorites } from '@/lib/favorites';
import { colors, screenPadding, type } from '@/theme';

/** 06 / Lugares salvos. */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { places, ready } = useFavorites();
  const empty = ready && places.length === 0;

  return (
    <View style={styles.screen}>
      <FocusStatusBar style="dark" />
      <FlatList
        data={places}
        keyExtractor={(place) => place.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 29 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[type.title, styles.ink]}>
              Seu mundo, salvo.
            </Text>
            <Text style={[type.body, styles.muted, styles.subtitle]}>Destinos para voltar a imaginar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <DestinationCard
            place={item}
            onPress={() => router.push({ pathname: '/destino', params: placeToParams(item) })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={ready ? undefined : <DestinationCardSkeleton />}
        ListFooterComponent={
          <View style={empty ? styles.footerEmpty : styles.footer}>
            <Text style={[type.subtitle, styles.ink]}>Sua próxima viagem começa aqui.</Text>
            <Text style={[type.body, styles.muted, styles.footerText]}>
              {'Seus destinos ficam neste dispositivo,\nmesmo quando você fecha o app.'}
            </Text>
            {empty ? (
              <Button
                label="Explorar destinos"
                onPress={() => router.navigate('/explorar')}
                style={styles.button}
              />
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: screenPadding, paddingBottom: 32 },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  header: { marginBottom: 62 },
  subtitle: { marginTop: 11 },
  separator: { height: 24 },
  footer: { marginTop: 40 },
  footerEmpty: { marginTop: 0 },
  footerText: { marginTop: 16 },
  button: { marginTop: 32 },
});
