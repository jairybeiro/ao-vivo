
# Plano de Implementação

## Resumo
Implementar duas melhorias: (1) proteger todas as rotas do aplicativo exigindo login e (2) garantir compatibilidade dos links m3u8 da Globo com os players existentes.

---

## Parte 1: Proteção de Todas as Rotas com Autenticação

### Abordagem
Criar um componente `ProtectedRoute` que envolve todas as rotas (exceto login e install) e redireciona usuários não autenticados para a página de login.

### Arquivos a Criar/Modificar

**1. Criar componente `ProtectedRoute`** (`src/components/ProtectedRoute.tsx`)
- Verifica se o usuário está autenticado via `useAuth()`
- Exibe loading enquanto verifica autenticação
- Redireciona para `/premium/login` se não autenticado
- Renderiza o conteúdo se autenticado

**2. Modificar `src/App.tsx`**
- Importar `ProtectedRoute`
- Envolver as seguintes rotas com proteção:
  - `/` (Index)
  - `/premium` 
  - `/premium/watch/:id`
  - `/course/:courseId`
  - `/admin`
- Manter SEM proteção:
  - `/premium/login` (página de login)
  - `/admin/login` (página de login admin)
  - `/install` (instruções de instalação PWA)

**3. Modificar `src/pages/Index.tsx`**
- Remover lógica de redirecionamento (já feita pelo ProtectedRoute)

**4. Simplificar páginas protegidas**
- `src/pages/Premium.tsx` - remover useEffect de redirecionamento
- `src/pages/PremiumWatch.tsx` - remover useEffect de redirecionamento
- `src/pages/CourseView.tsx` - remover useEffect de redirecionamento
- `src/pages/Admin.tsx` - manter verificação de isAdmin (além de autenticado)

---

## Parte 2: Compatibilidade com Links m3u8 da Globo

### Análise dos Links
Os links fornecidos seguem o padrão:
```
https://vod-01.edge-vtal-cwb-pr.video.globo.com/j/{JWT_TOKEN}/{path}.m3u8
```

**Observações:**
- São URLs m3u8 válidas que terminam em `.m3u8`
- Contêm tokens JWT com expiração (campo `exp` no JWT)
- O VideoPlayer atual já suporta URLs m3u8

### Ajustes Necessários

**1. Modificar validação de URL m3u8** (`src/pages/Index.tsx`, `src/pages/PremiumWatch.tsx`, `src/components/courses/LessonPlayer.tsx`)
- Atualizar a função `hasValidStreamUrls` para aceitar URLs m3u8 mais flexivelmente
- Algumas URLs m3u8 válidas contêm parâmetros após `.m3u8` (como `-audio_por=...`)
- Modificar a verificação de `.includes('.m3u8')` em vez de `.endsWith('.m3u8')`

**2. Atualizar filtros de URLs** em vários componentes
- Trocar `.endsWith(".m3u8")` por `.includes(".m3u8")` para capturar URLs como:
  ```
  ...manifest.ism/11015233-oiAjXxR-manifest-audio_por=128211-video_por=629000.m3u8
  ```

---

## Fluxo de Navegação Após Implementação

```text
Usuário não logado
        │
        ▼
   Qualquer rota
        │
        ▼
  ProtectedRoute
        │
        ▼
 Redireciona para
  /premium/login
        │
        ▼
  Faz login/signup
        │
        ▼
  Acesso liberado
```

---

## Seção Técnica

### Componente ProtectedRoute
```typescript
// Estrutura básica
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/premium/login" replace />;
  
  return children;
};
```

### Modificação de App.tsx
```typescript
// Rotas protegidas
<Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
<Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />

// Rotas públicas (login)
<Route path="/premium/login" element={<PremiumLogin />} />
```

### Validação de URLs m3u8 (ajuste)
```typescript
// De:
url.endsWith(".m3u8")

// Para:
url.includes(".m3u8")
```

---

## Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/ProtectedRoute.tsx` | Criar novo |
| `src/App.tsx` | Modificar rotas |
| `src/pages/Index.tsx` | Ajustar validação m3u8 |
| `src/pages/Premium.tsx` | Remover redirect manual |
| `src/pages/PremiumWatch.tsx` | Remover redirect manual + ajustar validação |
| `src/pages/CourseView.tsx` | Remover redirect manual |
| `src/components/courses/LessonPlayer.tsx` | Ajustar validação m3u8 |
