# Plano de Refactoring Profissional - Nexo

## Visão Geral

Este plano divide-se em **4 fases** sequenciais, cada uma construindo sobre a anterior. Tempo estimado total: **2 semanas** de trabalho focado.

---

## 🔴 Fase 1: Fundações (2-3 dias)

**Objetivo:** Estabelecer infraestrutura de qualidade antes de qualquer refactoring de código.

### 1.1 Adicionar Error Boundaries

**Ficheiros a criar:**
| Ficheiro | Propósito |
|----------|-----------|
| `app/error.tsx` | Error boundary global do Next.js |
| `app/palavras-cruzadas/error.tsx` | Error boundary específico |
| `app/sopa-de-letras/error.tsx` | Error boundary específico |
| `components/ErrorFallback.tsx` | UI de erro reutilizável |

### 1.2 Configurar Logger Estruturado

**Criar `lib/logger.ts`:**
- Logger configurável por ambiente
- Preparação para Sentry/tracking
- Substituir `console.log/debug/error` dispersos

### 1.3 Criar Constantes Globais

**Criar `lib/constants.ts`:**
- Magic numbers (timeouts, intervalos, tamanhos)
- Feature flags
- Configurações de retry

---

## 🟠 Fase 2: Refactoring do useMatchmaking (4-5 dias)

**Objetivo:** Dividir o hook monolítico de 687 linhas em módulos mais pequenos e manuteníveis.

### 2.1 Extrair Utilitários Puros

**Criar `lib/matchmaking/utils.ts`:**
```typescript
// Mover de useMatchmaking.ts:
export const buildPresencePayload = (...)
export const computeLobbyStats = (...)
export const deriveRating = (...)  // já existe parcialmente
export const deriveSkillBracket = (...)
```

### 2.2 Criar Hook de Presence

**Criar `hooks/useMatchmakingPresence.ts`:**
- `setupLobbyChannel()`
- `syncPresence()`
- `buildPresencePayload()`
- Estado: `lobbyStats`, `isConnected`

### 2.3 Criar Hook de Queue

**Criar `hooks/useMatchmakingQueue.ts`:**
- `subscribeToQueue()`
- `pollQueueSnapshot()`
- `handleQueueUpdate()`
- Estado: `queueEntry`, `queueStatus`

### 2.4 Criar Hook de Room

**Criar `hooks/useMatchmakingRoom.ts`:**
- `subscribeToRoom()`
- `fetchRoom()`
- `updateRoomState()`
- Estado: `room`, `participants`

### 2.5 Compor Hook Principal

**Refatorar `hooks/useMatchmaking.ts`:**
```typescript
export function useMatchmaking(gameType: SupportedMatchGame) {
  const presence = useMatchmakingPresence(gameType)
  const queue = useMatchmakingQueue(gameType)
  const room = useMatchmakingRoom()
  
  // Orquestração entre os três hooks
  // ~100-150 linhas em vez de 687
}
```

---

## 🟡 Fase 3: Refactoring de Componentes (5-6 dias)

**Objetivo:** Extrair componentes reutilizáveis e reduzir duplicação.

### 3.1 Extrair Utilitários de Grid

**Criar `lib/crossword/grid-utils.ts`:**
```typescript
export const getCellCounts = (grid: Cell[][]) => {...}
export const checkIsComplete = (grid: Cell[][]) => {...}
export const analyzeGrid = (grid: Cell[][]) => {
  // Uma única iteração, retorna tudo
  return { filled, total, correct, errors, isComplete }
}
export const findClueForCell = (cell, direction, clues) => {...}
export const isCellInCurrentWord = (cell, selectedClue, direction) => {...}
```

### 3.2 Extrair Navegação do Crossword

**Criar `hooks/useCrosswordNavigation.ts`:**
```typescript
export function useCrosswordNavigation(grid: Cell[][]) {
  // moveToNextCell, moveHorizontal, moveVertical
  // handleKeyDown logic
  // ~80 linhas extraídas do CrosswordGrid
}
```

### 3.3 Criar Componentes Partilhados de Jogo

**Criar `components/game/CompletionModal.tsx`:**
- Aceita props genéricas: `result`, `time`, `onRestart`, `onLeaderboard`
- Usado por Crossword, WordSearch, TicTacToe, Battleship

**Criar `components/game/GameHeader.tsx`:**
- Mode badge, timer, back button
- Props: `mode`, `timeMs`, `onBack`, `title`

**Criar `components/game/DuelProgressBar.tsx`:**
- Barra de progresso para duelos
- Props: `myProgress`, `opponentProgress`

### 3.4 Extrair Clue List

**Criar `components/crossword/ClueList.tsx`:**
- Lista de pistas com scroll automático
- Highlight da pista selecionada
- ~70 linhas extraídas do CrosswordGrid

### 3.5 Criar Hook de Duel Partilhado

**Criar `hooks/useGameDuel.ts`:**
```typescript
export function useGameDuel(gameType: 'crossword' | 'wordsearch') {
  // Lógica de duelo comum entre CrosswordGameShell e WordSearchGameShell
  // ~100 linhas extraídas de cada
}
```

### 3.6 Refatorar CrosswordGameShell

**Reduzir `components/CrosswordGameShell.tsx`:**
- De 580 linhas para ~250-300
- Usar novos componentes e hooks extraídos

---

## 🟢 Fase 4: Otimização e Polish (3-4 dias)

**Objetivo:** Performance, consistência e preparação para produção.

### 4.1 Adicionar Immer para Estado Imutável

```bash
npm install immer
```

**Refatorar mutações de grid:**
```typescript
// Antes (cria 225 novos objetos)
const newGrid = grid.map(r => [...r])
newGrid[row][col] = { ...newGrid[row][col], value: letter }

// Depois (mutação estrutural mínima)
import { produce } from 'immer'
setGrid(produce(grid, draft => {
  draft[row][col].value = letter
}))
```

### 4.2 Consolidar Estilos Tailwind

**Atualizar `app/globals.css`:**
```css
@layer components {
  .game-container {
    @apply min-h-screen bg-[#030014] relative overflow-hidden;
  }
  
  .glass-button {
    @apply px-4 py-2 rounded-lg bg-white/5 border border-white/10 
           hover:bg-white/10 transition-all duration-200;
  }
  
  .neon-text {
    @apply text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)];
  }
}
```

### 4.3 Remover Polling Desnecessário

**Em `hooks/useMatchmakingQueue.ts`:**
- Confiar no Realtime como primário
- Polling apenas como fallback após 10s sem updates
- Reduzir intervalo de polling de 3.5s para 8s

### 4.4 Adicionar Loading Skeletons

**Criar `components/ui/Skeleton.tsx`:**
- Skeletons para grid, clues, leaderboard
- Usar em vez de spinners genéricos

### 4.5 Configurar Sentry (Opcional mas Recomendado)

```bash
npx @sentry/wizard@latest -i nextjs
```

### 4.6 Documentar Componentes

**Criar Storybook ou JSDoc:**
- Documentar props de componentes principais
- Exemplos de uso
- Estados (loading, error, success)

---

## 📊 Métricas de Sucesso

| Métrica | Antes | Objetivo |
|---------|-------|---------|
| `useMatchmaking.ts` linhas | 687 | < 150 |
| `CrosswordGameShell.tsx` linhas | 580 | < 300 |
| `CrosswordGrid.tsx` linhas | 533 | < 350 |
| Refs em useMatchmaking | 14 | < 5 |
| Error Boundaries | 0 | 4+ |
| Componentes partilhados | ~3 | 8+ |

---

## 📅 Timeline Sugerida

```
Semana 1:
├── Dia 1-2: Fase 1 (Error Boundaries + Logger + Constantes)
├── Dia 3-5: Fase 2.1-2.3 (Primeiros hooks extraídos)

Semana 2:
├── Dia 1-2: Fase 2.4-2.5 (Completar useMatchmaking)
├── Dia 3-4: Fase 3.1-3.4 (Grid utils + Componentes partilhados)
├── Dia 5: Fase 3.5-3.6 (useGameDuel + Refatorar shells)

Semana 3 (opcional):
├── Dia 1-2: Fase 4.1-4.4 (Immer + Tailwind + Performance)
├── Dia 3: Fase 4.5-4.6 (Sentry + Documentação)
```

---

## ⚠️ Regras Durante o Refactoring

1. **Nunca quebrar a app** - Cada PR deve passar no build
2. **Commits atómicos** - Um ficheiro/conceito por commit
3. **Feature freeze** - Não adicionar features durante refactoring
4. **Code review** - Mesmo sozinho, rever PRs 24h depois
5. **Testar manualmente** - Validar cada mudança no browser antes de commitar

---

## Próximos Passos

Começar pela **Fase 1.1** - Criar Error Boundaries para proteger a aplicação de crashes.
