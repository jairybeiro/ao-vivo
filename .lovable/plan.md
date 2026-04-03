
# 📱 Plano: App Store Ready — Cursos + CineBusiness + Player Premium

## Fase 1: Limpeza — Remover conteúdo não-licenciado
Remover todas as funcionalidades de IPTV/streaming não-licenciado para conformidade com as políticas das App Stores.

**Páginas/Rotas a remover:**
- `/` (Home com canais ao vivo) → Substituir por landing page dos Cursos + CineBusiness
- `/entertainment` (Entretenimento/canais ao vivo)
- `/movies`, `/series`, `/vod-browse` (catálogo VOD pirata)
- `/vod-movie/:id`, `/vod-series/:id` (players VOD)
- `/premium`, `/premium-login`, `/premium-watch` (conteúdo premium IPTV)
- `/content/:id` (detalhe de conteúdo genérico)

**Componentes a remover:**
- `ChannelCard`, `ChannelList`, `VirtualChannelList`, `CategoryTabs`, `ScrollableCategories`
- `LivePlayer`, `StreamPlayer`, `DirectStreamPlayer`, `DetectStreamModal`
- `LiveIndicator`, `PlayerContainer`
- Catálogos: `DesktopChannelCatalog`, `MobileChannelCatalog`
- VOD: `DesktopMovieCatalog`, `MobileMovieCatalog`, `HeroBanner`, `EpisodesSheet`, etc.
- Ads: `PreRollAd`, `BelowPlayerAd`, `SidebarAd` (se não usar ads próprios)

**Edge Functions a remover:**
- `proxy-stream` (proxy IPTV)
- `resolve-stream` (resolver embeds)
- `resolve-txt-stream` (resolver .txt)
- `scrape-channels` (scraping)
- `import-xtream-vod` (importação Xtream)
- `verify-vod-links` (verificação links VOD)

**Hooks/SDK a remover:**
- `useChannels`, `useVod`, `usePremiumContent`, `useStreamPlayer`, `useResolveStream`
- `StreamPlayerSDK/` (SDK inteiro)
- `lib/streamProxy.ts`, `lib/hlsUtils.ts`

**Admin a simplificar:**
- Remover: `ChannelForm`, `ChannelList` (admin), `SyncChannelsButton`, `VodImport`, `VodMovieForm`, `VodMovieList`, `VodSeriesForm`, `VodSeriesList`, `VodEpisodeForm`, `PremiumContentForm`, `PremiumContentList`
- Manter: `CineBusinessForm`, `CourseManager`, `AdForm/AdList` (se usar ads próprios)

---

## Fase 2: Nova Home — Landing Cursos + CineBusiness
- Criar nova página Home com seções:
  - **Hero** com destaque rotativo (cursos + filmes CineBusiness)
  - **Continuar assistindo** (progresso do usuário)
  - **Cursos em destaque**
  - **CineBusiness — Filmes que inspiram**
- Navegação simplificada: Home | Cursos | CineBusiness | Perfil

---

## Fase 3: Player Premium Netflix — Rotação Forçada
- Criar `PremiumPlayer` dedicado com:
  - **Rotação forçada para paisagem** via Capacitor Screen Orientation plugin (`@capacitor/screen-orientation`)
  - Lock em `landscape` ao entrar no player, unlock ao sair
  - Layout imersivo 100vw/100vh sem barras de status
  - Controles Netflix-style existentes (volume, progresso, velocidade, skip ±10s)
  - Suporte a `hls.js` para streams .m3u8 e MP4 direto
  - Picture-in-Picture (PiP) via Capacitor plugin
  - **Prevenir sleep** da tela durante reprodução (`@capacitor/keep-awake`)
- Integrar com sistema de progresso existente (`user_watch_progress`)

---

## Fase 4: Setup Capacitor — App Nativo
- Instalar dependências Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`)
- Instalar plugins nativos:
  - `@capacitor/screen-orientation` (rotação forçada)
  - `@capacitor/status-bar` (esconder barra de status no player)
  - `@capacitor/splash-screen` (tela de splash personalizada)
  - `@capacitor/haptics` (feedback tátil)
- Configurar `capacitor.config.ts` com appId e appName
- Gerar ícones e splash screens para iOS e Android
- Testar em emuladores/dispositivos

---

## Fase 5: Preparação App Store
- **Apple App Store:**
  - Screenshots em todos os tamanhos obrigatórios (iPhone 6.7", 6.5", 5.5"; iPad 12.9")
  - Descrição, keywords, categoria (Educação ou Entretenimento)
  - Política de privacidade (obrigatória)
  - Review Guidelines compliance check
- **Google Play:**
  - Feature graphic (1024x500)
  - Screenshots
  - Classificação de conteúdo (IARC)
  - Política de privacidade

---

## Ordem de execução sugerida
1. **Fase 1** → Limpeza (remover IPTV) — ~2-3 sessões
2. **Fase 2** → Nova Home — ~1-2 sessões
3. **Fase 3** → Player Premium — ~2 sessões
4. **Fase 4** → Setup Capacitor — ~1 sessão
5. **Fase 5** → Assets e submissão — manual pelo desenvolvedor
