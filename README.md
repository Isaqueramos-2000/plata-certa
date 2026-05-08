# 🌱 PlantaCerta

App de identificação de plantas e guia de cuidados em pt-BR.
Construído como **um único codebase** que roda em web (debug rápido), iOS e Android — sem reescrever nada.

**🔗 Versão web ao vivo:** https://plata-certa.vercel.app
**📦 Repo:** https://github.com/Isaqueramos-2000/plata-certa

## Stack

- **Expo SDK 54** + React Native 0.81 + React Native Web 0.21
- **TypeScript strict**
- **Expo Router 6** — roteamento por arquivos, mesmo em web e mobile
- **NativeWind v4** — Tailwind CSS para componentes RN
- **Zustand 4** + `@react-native-async-storage/async-storage` — estado global persistido
- **expo-font** + Google Fonts (Fraunces, Inter) — tipografia
- **expo-image-picker** + **expo-image** — captura e exibição de fotos
- **`@anthropic-ai/sdk`** — integração com Claude Haiku 4.5 (vision + chat) com prompt caching
- **expo-image-manipulator** — resize 768×768 antes do upload pra cortar tokens de visão
- **i18n-js** — internacionalização (pt-BR de partida)

## Como rodar

### Pré-requisitos

- Node 20+
- npm 10+

### Setup

```bash
npm install
cp .env.example .env       # ainda não é necessário na Fase 1, mas já configure
```

### Web (recomendado para desenvolvimento)

```bash
npm run web
```

Abre http://localhost:8081 com hot reload e DevTools do Chrome funcionando.

### Mobile (Expo Go)

```bash
npm run android   # emulador Android
npm run ios       # simulador iOS (precisa de macOS) ou via Expo Go no celular
```

### Testes

```bash
npm test          # roda todos os testes unitários (Vitest)
npm run test:watch  # modo watch enquanto desenvolve
```

Os testes cobrem lógica pura (status de rega, parser de JSON do Claude, cache de espécies, ações do gardenStore). Componentes/UI dependem do runtime do RN e ficam fora do Vitest — pra E2E em web/mobile, recomenda-se Maestro ou Playwright em uma fase futura.

## Variáveis de ambiente

Crie `.env` a partir de `.env.example`:

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Chave da API Anthropic — usada por `services/plantAI.ts`. **Atenção**: variáveis `EXPO_PUBLIC_*` ficam expostas no bundle. Em produção, mova a chamada para um backend próprio (ver "Para virar app de produção"). |
| `EXPO_PUBLIC_USE_MOCK` | `true` faz `services/plantAI.ts` retornar mocks sem queimar tokens. Padrão recomendado durante desenvolvimento. Sem chave configurada, o app cai automaticamente em mock mode. |

## Arquitetura de identificação (Arquitetura B)

A identificação é desenhada pra ser **barata em escala**: o app não chama o LLM na maioria das vezes. O fluxo:

```
Imagem → resize 768×768 (corta ~60% dos tokens de visão)
   ↓
Stage 1 (Haiku 4.5, ~$0.001) → nome científico + confiança
   ↓
Cache local (AsyncStorage, indexado por nome científico)
   │
   ├─ HIT  → guia cacheado, custo final ~$0.001
   │
   └─ MISS → Stage 2 (Haiku 4.5, ~$0.005) → guia completo, salva no cache
              custo final ~$0.006
```

**Pontos importantes:**

- **Haiku 4.5 nas duas etapas** (era Sonnet no Stage 2): troca pegou um modelo 3× mais barato sem perda perceptível em planta comum. Pra casos de baixa confiança, dá pra implementar fallback Sonnet só nesses ~5%.
- **Resize antes do upload**: `lib/imageResize.ts` reduz pra 768×768 jpeg quality 0.7 antes de mandar pra API. Tokens de visão caem de ~1500 pra ~640 (≈ –57%) — e como bônus, a foto vira `data:` URL portátil que persiste no localStorage entre sessões (resolve o bug de "foto some").
- **Prompt caching da Anthropic** está ativo nos system prompts dos dois estágios (5min TTL no servidor da Anthropic, –90% no input dos tokens cacheados).
- **Bundle seed** em `assets/mocks/seed-cache.ts` pré-popula o cache com espécies populares no primeiro launch. Pra adicionar novas, gere offline com Claude e cole no array `SEED_SPECIES` (incremente `SEED_VERSION` pra forçar re-seed).
- **TTL** do cache local é **1 ano** — guias de cuidados quase não mudam. Pra produção, recomenda-se mover o cache pra um backend compartilhado (Supabase) pra que cada espécie seja gerada uma única vez para todos os usuários.

**Estimativa de custo (5.000 usuários ativos × 5 IDs/mês = 25k IDs/mês):**

| Cenário | Cache miss | Custo Claude | Total/mês |
|---|---|---|---|
| **Antes da otimização** (Sonnet, sem resize) | 20% (5K calls) | ~$95 | ~$95 |
| **Atual** (Haiku + resize, cache local) | 20% (5K calls) | ~$30 | **~$30** |
| **Produção** (cache compartilhado, Supabase) | 1% (250 calls) | ~$2 | **~$27** (com $25 Supabase) |

Por usuário: **~$0,006/mês** no atual. Margem brutal pra uma assinatura de R$10/mês (cobre o custo ~270×).

## Q&A sobre plantas (Haiku 4.5)

Cada planta identificada (e cada planta no jardim, na Fase 5) abre um painel de **perguntas livres** ao usuário. Modelo: **Haiku 4.5** (rápido, conciso, ~$1/MTok in / $5/MTok out). Resposta limitada a ~350 tokens pra ficar curta e direto ao ponto.

- **Limite inicial: 10 perguntas/usuário (lifetime, sem reset).** Persistido no `stores/questionsStore.ts`. Quando esgotar, a UI mostra um aviso "Em breve, planos com mais perguntas". O número é trocável quando entrar uma assinatura.
- **Prompt caching** ativo no system prompt + contexto da espécie. Perguntas seguidas sobre a mesma planta consomem ~10% do input.
- Custo médio por pergunta: **~$0.0017**.

**Custo do feature pra 5.000 usuários:**
- Pior caso (todos esgotam): 50K calls × $0.0017 = ~$85 one-time
- Realista (50% usam, média 4 perguntas): ~10K calls/mês × $0.0017 = **~$17/mês**

## Notificações de rega (mobile)

`services/notifications.ts` agenda lembretes locais via `expo-notifications`:

- Quando uma planta é adicionada ao jardim, agenda um lembrete pra `nextWateringAt` (= now + `waterFrequencyDays` dias da espécie).
- Ao marcar "Reguei agora", o lembrete antigo é cancelado e um novo é agendado.
- Ao remover a planta, o lembrete é cancelado.
- A permissão é pedida na primeira planta salva. Se o usuário recusar, o app continua funcionando — só sem alerta proativo (a data ainda aparece no app).
- **Web é no-op** — o usuário-alvo do feature usa quase 100% mobile, e notificações persistentes na aba do navegador podem ser estranhas.

Cada `SavedPlant` carrega seu `wateringNotificationId` (ou null) pra permitir cancelar/reagendar sem perder rastro. Android usa um channel "watering" com importância default; iOS funciona out-of-the-box.

## Persistência local (Meu Jardim)

`stores/gardenStore.ts` guarda as plantas do usuário num Zustand persist com AsyncStorage. Cada planta salva tem:

- `nickname` (apelido escolhido pelo usuário)
- `photoUri` + `photos[]` (galeria)
- `identification` (snapshot do guia gerado pela IA)
- `careLog[]` (timeline de "regou", "adubou", "podou", "tirou foto")
- `lastWateredAt` + `nextWateringAt` (calculados via [lib/wateringStatus.ts](lib/wateringStatus.ts) usando `care.waterFrequencyDays`)
- `chatHistory[]` (Q&A persistido por planta)

A camada AsyncStorage é localStorage no web e SQLite/SharedPreferences no mobile. Se um usuário tiver mais de ~500 plantas (improvável), vale migrar pra `expo-sqlite` direto pra ter queries indexadas.

## Custo total combinado (otimizado)

Pra **5.000 usuários ativos** (5 IDs/mês + 4 perguntas/mês cada):

| Item | MVP atual (cache local) | Produção (backend + Supabase) |
|---|---|---|
| Identificação (Haiku + resize) | ~$30 | ~$2 |
| Q&A Haiku | ~$17 | ~$17 |
| Supabase | – | $25 |
| **Total/mês** | **~$47** | **~$44** |
| **Por usuário/mês** | **~$0,009** | **~$0,009** |
| **Por usuário/ano** | **~$0,11** | **~$0,11** |

Com **assinatura R$10/mês** (≈ $1,80 USD) por usuário, **margem de ~200×** sobre o custo de IA. Espaço enorme pra cobrir App Store fee (15-30%), gateway de pagamento, marketing, suporte.

| | Receita/usuário/mês | Custo IA | Margem bruta IA |
|---|---|---|---|
| R$10 plano básico | $1,80 | $0,009 | 99,5% |
| R$10 com 30% Apple fee | $1,26 | $0,009 | 99,3% |

## Deploy

### Web (Vercel) — já no ar

URL de produção: **https://plata-certa.vercel.app**

```bash
# Setup inicial (uma vez):
vercel link --project plata-certa
vercel env add EXPO_PUBLIC_ANTHROPIC_API_KEY production

# Deploy de novas versões:
vercel deploy --prod
```

`vercel.json` configura:
- Build: `npx expo export --platform web` → produz `dist/`
- Rewrites: tudo cai em `/index.html` (SPA — necessário pra rotas dinâmicas tipo `/plant/[id]`)

### iOS (App Store) — roadmap

Seu modelo: **assinatura R$10/mês**. Apple cobra **30% no primeiro ano, 15% após o ano** (Small Business Program ↓ pra 15% se faturamento &lt; $1M/ano — **provavelmente seu caso**).

**Passo a passo:**

1. **Apple Developer Program** — US$99/ano. Inscreva-se em https://developer.apple.com/programs/ com seu Apple ID.
2. **Configurar `app.json`** pra produção:
   - `ios.bundleIdentifier`: `com.seudominio.plantacerta` (escolha único)
   - `ios.buildNumber`: `"1"`
   - Ícones finais em `assets/images/icon.png` (1024×1024 sem transparência)
   - Splash em `assets/images/splash-icon.png`
3. **EAS Build** (build na nuvem da Expo, sem precisar de Mac local):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform ios --profile production
   ```
   Demora 15-30min. Resulta num `.ipa` pronto pra TestFlight.
4. **App Store Connect** — https://appstoreconnect.apple.com:
   - Cria o app com o mesmo bundle ID
   - Sobe screenshots (5,5" iPhone obrigatório)
   - Preenche descrição, privacy policy URL, support URL
   - Configura **In-App Purchase de assinatura** (R$9,90 ou similar — Apple aceita centavos pra ficar elegante)
5. **Integração de pagamento** — use **RevenueCat**:
   - Free pra começar (até $2.5K MRR)
   - Cuida da validação de receipts, cancelamentos, restore purchases
   - Update `services/subscription.ts` (a criar) com `Purchases.getCustomerInfo()`
   - Quando o usuário compra, chame `useQuestionsStore.getState().setLimit(100)` (ou ilimitado)
6. **Submit pra review** — primeiro review demora 24-72h. Apple às vezes pede ajustes (descreve melhor, esconda recursos não disponíveis, etc.). Iteração faz parte.

**Antes de submeter, leia:**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — especialmente seções 3.1 (pagamentos), 5.1 (privacidade)
- Privacy Policy obrigatória (mesmo de uma página em Notion público funciona; mencione: armazenamento local de fotos, envio anônimo à Anthropic, retenção zero)
- LGPD: incluir botão "Apagar meus dados" no Perfil

**Custo total pra subir o app:**

| Item | Custo |
|---|---|
| Apple Developer Program | US$99/ano (~R$540) |
| Domínio (opcional, pra privacy policy) | R$40/ano |
| RevenueCat | $0 até $2.5K MRR |
| Conta Vercel | Hobby grátis até bater limites (você está nele) |
| **Total ano 1** | **~R$580** + custos de IA escaláveis |

**Antes de Android:** rodar **Google Play** custa apenas $25 vitalício (não anual). Vale subir junto pra dobrar alcance — usa `eas build --platform android` com a mesma codebase.

### ⚠️ ANTES de submeter pra review

A chave Anthropic atual está embutida no bundle (variável `EXPO_PUBLIC_*`). **Quem baixar o app vai conseguir extrair a chave.** Antes do TestFlight público / submit:

1. Crie um Cloudflare Worker (ou Vercel Function) que recebe `{ image: base64 }` e chama o Claude no backend
2. Atualize `services/plantAI.ts` e `services/plantChat.ts` pra usar `fetch('/api/identify', ...)` em vez do SDK
3. Migre o cache pra Supabase (mesma interface, novo backend)
4. Rotacione a chave atual no console Anthropic — considere ela vazada

Posso te ajudar a montar esse backend quando chegar a hora.

## Mock mode

Por padrão (sem chave ou com `EXPO_PUBLIC_USE_MOCK=true`), `identifyPlant()` devolve uma das 4 plantas em `assets/mocks/identifications.ts` aleatoriamente. Útil pra desenvolver UI sem queimar tokens. O badge **"Modo demo"** aparece na tela de resultado pra deixar claro.

## Estrutura

```
app/                       # Expo Router — telas
  _layout.tsx              # Stack root + providers + global.css
  (tabs)/                  # Tabs: Meu Jardim, Identificar, Aprender, Perfil
  plant/[id].tsx           # Detalhe de uma planta salva
  result.tsx               # Resultado da identificação
components/
  ui/                      # Botões, cards, inputs (Fase 2)
  plant/                   # Cards e abas de plantas (Fase 3+)
  camera/                  # Captura de foto (Fase 3)
services/
  plantAI.ts               # Identificação com Claude (two-stage + cache) (Fase 4)
  plantChat.ts             # Q&A breve com Haiku (Fase 4.5)
  speciesCache.ts          # Cache local por nome científico (Fase 4)
  storage.ts               # SQLite (mobile) + localStorage (web) (Fase 5)
  notifications.ts         # Lembretes de rega (Fase 6)
stores/
  gardenStore.ts           # Plantas do usuário (Zustand) (Fase 5)
  identificationStore.ts   # Resultado da última identificação (Fase 4)
  learnChatStore.ts        # Histórico geral da aba Aprender (Fase 6)
  questionsStore.ts        # Contador de perguntas usadas (Fase 4.5)
  settingsStore.ts         # Modo acessível e preferências (Fase 2)
assets/
  mocks/
    articles.ts            # 6 artigos do Aprender (Fase 6)
    identifications.ts     # 4 plantas mockadas (UI dev)
    seed-cache.ts          # Bundle de espécies pré-cacheadas (produção)
__tests__/
  setup.ts                 # mocks de react-native + AsyncStorage + expo-notifications
  *.test.ts                # 37 testes unitários (lógica pura + stores)
lib/
  theme.ts                 # Tokens de design (cores, fontes, spacing)
  i18n.ts                  # Setup i18n + helpers
  locales/pt-BR.ts         # Strings pt-BR
  platform.ts              # Helpers Platform.OS
types/
  plant.ts                 # Contratos de identificação
__tests__/                 # Testes (Fase 6)
```

## Roadmap

| Fase | Status | Entregue |
|------|--------|----------|
| 1 — Setup e Estrutura | ✅ Concluída | Expo + Router + NativeWind + tema + tabs vazias |
| 2 — UI Base e Design System | ✅ Concluída | Componentes ui/, onboarding 3 etapas, modo acessível com persistência, Home com estado vazio |
| 3 — Captura e mock de identificação | ✅ Concluída | Captura câmera/galeria, state machine com loading, tela de resultado com 4 mocks (incluindo low-confidence) |
| 4 — Integração com Claude API | ✅ Concluída | Two-stage Haiku+Sonnet, cache de espécies em AsyncStorage, prompt caching, mock mode, tratamento de erros |
| 4.5 — Q&A breve com Haiku | ✅ Concluída | `AskPanel` com chips, contador 10/usuário, histórico de conversa |
| 5 — Persistência e Meu Jardim | ✅ Concluída | `gardenStore` com Zustand persist, modal de apelido, grid no Home, tela de detalhe com ações de cuidado, timeline e Q&A persistido por planta |
| 6 — Polimento | ✅ Concluída | Notificações de rega (mobile), Aprender com Q&A + 6 artigos categorizados, leitor de artigo, markdown no chat e nos artigos, data absoluta no histórico, animação de entrada na timeline, testes unitários (37 testes em 4 arquivos), README completo |

## Para virar app de produção

Antes de publicar nas lojas:

### Segurança (P0)

- [ ] **Rotacionar a chave Anthropic atual** — qualquer chave em `EXPO_PUBLIC_*` é embarcada no bundle JS e fica visível pra qualquer um que faça reverse-engineering. Trate como vazada assim que for compilar pra produção.
- [ ] **Backend para esconder a API key** — Cloudflare Worker ou função serverless intermediando as chamadas à Anthropic. Substitua as chamadas em `services/plantAI.ts` e `services/plantChat.ts` por `fetch('/api/identify', ...)` apontando pro seu backend. Backend valida o usuário, consulta o cache compartilhado, e só chama Claude quando precisa.
- [ ] **Cache compartilhado em Supabase** — substituir o backend de `services/speciesCache.ts` por uma tabela `species` no Supabase indexada por `scientific_name`. Mantém a mesma interface (`getCached/setCached`), troca só a implementação. Resultado: primeira pessoa a identificar uma espécie paga; próximos 10K usuários consomem do cache.

### Build & deploy

- [ ] **EAS Build** configurado para builds nativos automatizados (`eas.json`)
- [ ] **Configuração de signing** iOS (Apple Developer Account) e Android (keystore via `EAS Submit`)
- [ ] **Bundle ID definitivo** em `app.json` (atualmente `plantacerta`)
- [ ] **Ícones e splash final** — substituir os do template em `assets/images/`. Recomendo gerar com `expo-asset-generator` ou figma plugin oficial.
- [ ] **App Store Connect** e **Google Play Console** com fichas técnicas + screenshots em pelo menos 2 idiomas

### Compliance

- [ ] **Política de privacidade** publicada — exigida pelas duas lojas. Mencione: armazenamento local de fotos, envio anônimo de imagens à Anthropic, retenção zero do lado do servidor (a Anthropic não treina com dados de API por padrão).
- [ ] **Termos de uso** explicando o limite de 10 perguntas e qualquer plano pago
- [ ] **LGPD** — botão "Apagar meus dados" no Perfil que limpa AsyncStorage + cancela notificações + (futuro) deleta linha do backend
- [ ] **Permissões iOS no `Info.plist`** — strings amigáveis pra `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (Expo gera automático com base em `app.json` plugins, conferir no build)

### Performance & escala

- [ ] **Migrar `gardenStore` pra `expo-sqlite`** se algum usuário começar a ter +500 plantas (raro). AsyncStorage performa bem até essa faixa.
- [ ] **Pré-popular `seed-cache.ts`** com 100-200 espécies mais comuns no Brasil. Gere offline com Claude (script único) e versione no repo. Custo único: ~$2.
- [ ] **Monetização** — assinatura via RevenueCat, ajustando `questionsStore.setLimit()` conforme o tier (10 grátis / 100 mensal / ilimitado anual).

### Qualidade

- [ ] **Testes E2E** com Maestro (mobile) ou Playwright (web): fluxo de identificação completo, adicionar ao jardim, marcar como regada, abrir artigo. Já tem 37 unit tests cobrindo a lógica pura.
- [ ] **Sentry / Bugsnag** pra capturar erros em produção
- [ ] **Analytics anônimo** (PostHog / Mixpanel) pra entender quais espécies são mais identificadas, taxa de retenção

## Princípios

- **Acessibilidade desde o primeiro componente** — área de toque ≥ 48dp (56dp em modo acessível), modo acessível com fontes +30% e contraste reforçado.
- **Tom de voz acolhedor e claro** — sem jargão técnico, frases curtas, ativas. Aplicado tanto na UI quanto nos prompts do Claude.
- **Visual calmo** — paleta sálvia/terracota, tipografia botânica (Fraunces) + alta legibilidade (Inter), whitespace generoso.
- **Mobile-first cross-platform** — um único codebase em Expo SDK 54 roda em web, iOS e Android. No web, conteúdo é centralizado em coluna de 480px pra preservar a sensação mobile.

## Sugestões de nome alternativo

Caso queira repensar o nome "PlantaCerta":

1. **Florescer** — verbo, evoca crescimento e cuidado, fácil de pronunciar.
2. **Botânica** — direto, premium, e o domínio `botanica.app` provavelmente está aberto.
