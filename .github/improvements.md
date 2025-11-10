1. Backend / geração diária

Telemetria de falhas na geração (logs/metrics). Melhorar logs em index.ts e generate-daily-wordsearch. Prioridade: alta.
Retry + qualidade: aumentar heurística no crossword-generator.ts para rejeitar puzzles com poucas interseções. Referência: CrosswordGenerator. Prioridade: média.
Endpoint de preview/regen para admin: rota protegida para gerar teste manual. Implementar na função Edge ou rota API. Prioridade: baixa.
Agendamento: verificar 005_schedule_daily_crossword.sql e garantir variáveis (PROJECT_URL, service_role_key) estão no Vault. Prioridade: alta para produção.

2. Pequenas melhorias UX/Polish

Contador de erros e opção de mostrar apenas erros (modo treino). Editar CrosswordGrid UI.
Botão "Novo Aleatório" que chama /api/crossword/random com loading state e animação. See [app/palavras-cruzadas/page.tsx] which already switches endpoint.
Sinais visuais para células reveladas vs preenchidas vs corretas/erradas (cores acessíveis). Atualizar classes Tailwind em componentes.
Internacionalização strings PT-PT: garantir todos textos UI em PT-PT nos ficheiros de página e componentes (por exemplo em app/palavras-cruzadas/page.tsx). Prioridade: alta.

3. Geral (ambos jogos)

Categorizar as palavras do dicionario para a criação de jogos com temas de palavras. Prioridade: alta.
Adicionar novas palavras ao dicionario com a sua respetiva categoria. Prioridade: alta.
Sincronização condicional com Supabase para utilizadores autenticados (salvar progresso/estado). Usar o singleton supabase e endpoints existentes (route.ts como referência). Prioridade: média.
Normalização de diacríticos para comparação/validação (NFD + remover diacríticos). Criar utilitário em lib/text.ts e usar em validações do grid e generator. Prioridade: alta (PT-PT UX).
Acessibilidade: roles/aria-labels para células, foco visível, leitura por screen-readers. Modificar [components/CrosswordGrid.tsx] e [components/WordSearchGrid.tsx]. Prioridade: alta.
Export/Share (link + imagem): botão “Partilhar” que cria snapshot (canvas → imagem) ou gera URL com puzzle id. Integrar com social share. Prioridade: baixa-média.
Modo impressão: gerar versão print-friendly (CSS) para exportar em papel. Prioridade: baixa.
Optimização de UI para dispositivos mobile, permissão para escrever nas palavras cruzadas. Prioridade: Muito Alta

4. Palavras Cruzadas

Hints com limitação: revelar letra / palavra com custo (ex.: +5s ao tempo ou contador de hints). Implementar lógica em [components/CrosswordGrid.tsx] e usar Timer em components/Timer.tsx. Prioridade: média.
Contador de letras/faltantes por pista e indicador de cruzamentos restantes (visual). Implementar no UI do grid e na listagem de pistas. Prioridade: baixa.
"Auto-correct" opcional (modo treino): aceitar respostas sem acentos e mostrar correção (usar utilitário de normalização). Prioridade: média.
Cache de puzzle diário + flag isFromPreviousDay: usar /app/api/crossword/daily/route.ts para receber isFromPreviousDay e mostrar banner. Prioridade: alta (UX diário).
Sopa de Letras
Modo toque otimizado: permitir seleção por touch-swipe com preview visual da palavra. Modificar components/WordSearchGrid.tsx e usar helpers de wordsearch-generator.ts(/home/cruz/nexo/lib/wordsearch-generator.ts). Prioridade: alta (mobile-first).
Indicador de palavras restantes + ordenar palavras encontradas/pendentes. UI em lista lateral. Prioridade: baixa.
Hints: destacar primeiro e último caractere da palavra ou mostrar direcção. Prioridade: baixa-média.
Gerar puzzles com dificuldade ajustável (tamanho, sentido, palavras diagonais, tema). Expor ajuste em [app/sopa-de-letras/page.tsx] e parâmetro ao gerador (wordsearch-generator.ts). Prioridade: média.

5. Novos Jogos:

Jogo da forca
Tic Tac Toe
Jogo do Gringo (Cartas)
