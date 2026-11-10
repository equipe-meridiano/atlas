import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Contours,
  DestinationCard,
  DestinationCardSkeleton,
  SearchField,
  Skeleton,
} from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { placeSubtitle, placeToParams, type Place } from '@/data/place';
import { useRetryListener } from '@/lib/retry';
import { MIN_QUERY_LENGTH, useCitySearch, type SearchState } from '@/lib/useCitySearch';
import { useOfflineRedirect } from '@/lib/useOfflineRedirect';
import { colors, screenPadding, type } from '@/theme';

/** 03 / Buscar destinos e 07 / Busca sem resultados. */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { foco } = useLocalSearchParams<{ foco?: string }>();
  const inputRef = useRef<TextInputInstance>(null);
  const [text, setText] = useState('');
  const { state, retry } = useCitySearch(text);

  // Veio do campo de busca do Explorar: abre o teclado.
  useEffect(() => {
    if (foco) inputRef.current?.focus();
  }, [foco]);

  useRetryListener('buscar', retry);
  useOfflineRedirect(state.status === 'offline' ? state : null, 'buscar');

  function tryAnotherSearch() {
    setText('');
    inputRef.current?.focus();
  }

  const results = state.status === 'success' ? state.results : [];

  return (
    <View style={styles.screen}>
      <FocusStatusBar style="dark" />
      <FlatList
        data={results}
        keyExtractor={(place) => place.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 29 }]}
        ListHeaderComponent={
          <View>
            <Text accessibilityRole="header" style={[type.title, styles.ink]}>
              Encontre seu lugar.
            </Text>
            <View style={styles.search}>
              <SearchField value={text} onChangeText={setText} inputRef={inputRef} />
            </View>
            <ResultsHeader state={state} />
          </View>
        }
        renderItem={({ item, index }) => <ResultItem place={item} first={index === 0} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyArea state={state} onTryAnother={tryAnotherSearch} onRetry={retry} />}
        ListFooterComponent={
          results.length > 0 ? (
            <Text style={[type.body, styles.muted, styles.footnote]}>
              {'Coordenadas e fuso horário disponíveis\nnos detalhes do destino.'}
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

/** "Resultados para “…”" + a aba "Cidades", visível enquanto carrega e com resultados. */
function ResultsHeader({ state }: { state: SearchState }) {
  if (state.status !== 'loading' && state.status !== 'success') return null;

  return (
    <View>
      <Text
        style={[type.body, styles.muted, styles.resultsFor]}
        accessibilityLiveRegion="polite"
      >{`Resultados para “${state.query}”`}</Text>
      <View style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: true }}>
        <Text style={[type.tab, styles.blue]}>Cidades</Text>
        <View style={styles.tabIndicator} />
      </View>
    </View>
  );
}

function ResultItem({ place, first }: { place: Place; first: boolean }) {
  return (
    <View style={first ? styles.firstItem : undefined}>
      <DestinationCard
        place={place}
        onPress={() => router.push({ pathname: '/destino', params: placeToParams(place) })}
      />
      <Text style={[type.bodyLarge, styles.ink, styles.subtitle]}>{placeSubtitle(place)}</Text>
    </View>
  );
}

type EmptyProps = { state: SearchState; onTryAnother: () => void; onRetry: () => void };

/** O que aparece no lugar da lista: dica, carregamento, sem resultados ou erro. */
function EmptyArea({ state, onTryAnother, onRetry }: EmptyProps) {
  switch (state.status) {
    case 'idle':
      return (
        <Text style={[type.body, styles.muted, styles.hint]}>
          {`Digite pelo menos ${MIN_QUERY_LENGTH} letras do nome de uma cidade.`}
        </Text>
      );
    case 'loading':
      // Skeleton com o mesmo tamanho do resultado: a tela não "pula" quando ele chega.
      return (
        <View style={styles.firstItem}>
          <DestinationCardSkeleton />
          <Skeleton style={styles.subtitleSkeleton} />
        </View>
      );
    case 'empty':
      return (
        <EmptyMessage
          title={'Ainda não\nencontramos.'}
          text={'Confira o nome da cidade ou tente\numa cidade próxima.'}
          action="Tentar outra busca"
          onPress={onTryAnother}
        />
      );
    case 'offline':
      // A tela "O caminho pausou" já abriu; isto aparece se a pessoa voltar sem tentar de novo.
      return (
        <EmptyMessage
          title={'O caminho\npausou.'}
          text={'Verifique sua conexão e tente de novo.'}
          action="Tentar novamente"
          onPress={onRetry}
        />
      );
    case 'error':
      return (
        <EmptyMessage
          title={'O mapa não\ncarregou.'}
          text={'O serviço de clima respondeu de um jeito\ninesperado. Tente de novo em instantes.'}
          action="Tentar de novo"
          onPress={onRetry}
        />
      );
    default:
      return null;
  }
}

type MessageProps = { title: string; text: string; action: string; onPress: () => void };

function EmptyMessage({ title, text, action, onPress }: MessageProps) {
  return (
    <View>
      <Contours variant="buscaVazia" style={styles.emptyContours} />
      <Text accessibilityRole="header" style={[type.titleLight, styles.ink]}>
        {title}
      </Text>
      <Text style={[type.body, styles.muted, styles.emptyText]}>{text}</Text>
      <Button label={action} onPress={onPress} style={styles.emptyButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: screenPadding, paddingBottom: 32 },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  blue: { color: colors.blue },
  search: { marginTop: 24 },
  resultsFor: { marginTop: 28 },
  tab: { marginTop: 24, alignSelf: 'flex-start', minHeight: 34 },
  tabIndicator: { marginTop: 14, height: 3, width: 62, backgroundColor: colors.blue },
  firstItem: { marginTop: 24 },
  subtitle: { marginTop: 28 },
  subtitleSkeleton: { marginTop: 28, height: 22, width: 160, borderRadius: 6 },
  separator: { height: 32 },
  footnote: { marginTop: 14 },
  hint: { marginTop: 28 },
  // Figma: as curvas começam 51pt abaixo do campo e o título invade 17pt da parte de baixo delas.
  emptyContours: { marginTop: 51, marginLeft: 26, marginBottom: -17 },
  emptyText: { marginTop: 18 },
  emptyButton: { marginTop: 60 },
});
