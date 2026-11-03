# Atlas

App mobile para descobrir cidades e consultar o clima antes de viajar.
Projeto da **Equipe Meridiano**, construído a partir do design "Atlas v1.0" no Figma.

**Stack:** React Native + TypeScript + Expo (SDK 58), com Expo Router para a navegação.
**Dados:** [Open-Meteo](https://open-meteo.com) para cidades e clima, e [Wikimedia](https://commons.wikimedia.org) para as fotos das cidades. Os dois são gratuitos e sem chave de API.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) na versão LTS e o app **Expo Go** no celular (Android ou iPhone).

```bash
npm install        # instala as dependências
npx expo start     # sobe o servidor de desenvolvimento
```

Aparece um QR code no terminal. No Android, leia com o Expo Go; no iPhone, com a câmera.
O celular e o computador precisam estar na mesma rede Wi-Fi.

Outros comandos:

```bash
npm test           # testes automáticos (formatação, API, armazenamento)
npm run typecheck  # confere os tipos do TypeScript
npm run web        # abre o app no navegador (útil para testar rápido)
```

## Telas do Figma → arquivos

| Figma | Arquivo | O que faz |
|---|---|---|
| 01 / Começar | `src/app/index.tsx` | Entrada do app |
| 02 / Explorar | `src/app/(abas)/explorar.tsx` | Destaques e atalho para a busca |
| 03 / Buscar destinos | `src/app/(abas)/buscar.tsx` | Busca de cidades na API |
| 04 / Destino | `src/app/destino.tsx` | Coordenadas, fuso e botão de salvar |
| 05 / Clima do destino | `src/app/clima.tsx` | Clima atual e próximos dias |
| 06 / Lugares salvos | `src/app/(abas)/salvos.tsx` | Destinos guardados no celular |
| 07 / Busca sem resultados | `src/app/(abas)/buscar.tsx` | Estado vazio da busca |
| 08 / Sem conexão | `src/app/sem-conexao.tsx` | Erro de internet com nova tentativa |

## Estrutura de pastas

```
src/
  app/          Telas. Cada arquivo é uma rota (regra do Expo Router).
    (abas)/     As três telas com barra de abas embaixo.
  components/   Peças reutilizáveis: botão, campo de busca, card, barra de abas.
  data/         Tipos e dados fixos (destinos em destaque, fotos).
  lib/          Lógica sem tela: API, formatação, armazenamento, animações.
  theme/        Cores, espaçamentos e fontes do design (os "tokens").
assets/
  contornos/    Curvas de nível exportadas do Figma em SVG.
  images/       Fotos editoriais exportadas do Figma.
```

## Como o app segue o handoff

**Dados.** A busca usa o Geocoding do Open-Meteo (`/v1/search`) e o clima usa o Forecast
(`/v1/forecast`, `current` + `daily`, `timezone=auto`). Toda resposta é validada campo a campo
antes de ser usada (`src/lib/openMeteo.ts`). Os favoritos ficam no próprio celular (AsyncStorage).

**Fotos das cidades.** O Open-Meteo não tem fotos, então cada resultado da busca procura a sua
no Wikimedia (`src/lib/cityPhotos.ts`): o `id` da cidade no Open-Meteo é o número dela no GeoNames,
o Wikidata diz qual é a imagem principal da cidade com esse número, e o Commons devolve a miniatura,
o autor e a licença. São 3 requisições para a lista inteira. O crédito da foto aparece na ficha do
destino, como as licenças Creative Commons exigem. Sem foto no Wikimedia (ou se ele falhar), a cidade
usa uma das fotos editoriais do design. Os destaques do Explorar mantêm as fotos do design.

**Busca.** Espera 350ms depois da última tecla (*debounce*) e cancela a busca anterior quando
a pessoa continua digitando. Requisições têm timeout de 10s; sem internet, abre a tela 08.

**Movimento.** Entrada → Explorar: dissolve 400ms. Card → Destino: 400ms. Navegação e abas:
dissolve 200ms. Toque: opacidade 85% em 120ms. Com "Reduzir movimento" ativo no celular,
tudo vira dissolve de 100ms. Os tempos ficam em `src/lib/motion.ts`.

**Acessibilidade.** Alvos de toque de 48dp, texto base de 16dp, área segura respeitada,
fonte acompanha a escala do sistema, botões e imagens com rótulo para leitor de tela.

### Ajustes em relação ao protótipo

- A barra de status desenhada no Figma (9:41, 5G) é substituída pela barra real do celular.
- Os textos "dados de demonstração" e "valores ilustrativos" viraram a fonte real ("Dados: Open-Meteo") e o horário local da leitura, porque agora os dados são reais.
- As cidades buscadas mostram a foto real do Wikimedia; as fotos editoriais do design ficam nos destaques e como reserva.
- O "smart animate" do card foi aproximado por um dissolve com leve crescimento (96% → 100%).
- Estados que o Figma não mostra e o app precisa: dica na busca vazia, skeleton de carregamento, erro do servidor e botão "Explorar destinos" quando não há nada salvo.

## Git

- **Commits pequenos, um por funcionalidade**, no formato `tipo(área): descrição`
  (ex.: `feat(telas): 06 Lugares salvos`, `fix(busca): ...`, `docs: ...`).
- A `main` recebe código só por *pull request* (pedido para juntar código, revisado por outra pessoa).
- Trabalhe numa branch própria: `git checkout -b feat/nome-da-tarefa`.
- A tag `design-v1.0` marca a implementação da versão 1.0 do design.
