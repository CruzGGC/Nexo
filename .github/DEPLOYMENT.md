# Guia de Deployment - Sistema de Geração Automática de Palavras Cruzadas

## 📋 Visão Geral

Este sistema gera automaticamente palavras cruzadas todos os dias à meia-noite (hora de Portugal) usando uma lista curada de palavras portuguesas.

## 🚀 Passos de Deployment

### 1️⃣ Executar Migrations

No Supabase SQL Editor, execute as migrations na ordem:

```bash
# 1. Schema base (já deve estar feito)
supabase/migrations/001_initial_schema.sql

# 2. Adicionar coluna de definições
supabase/migrations/002_add_definitions_to_dictionary.sql

# 3. Agendar cron job (executar DEPOIS do Edge Function estar deployed)
supabase/migrations/003_schedule_daily_crossword.sql
```

### 2️⃣ Importar Palavras Portuguesas

Execute o ficheiro no Supabase SQL Editor:

```sql
supabase/portuguese_words.sql
```

Isto vai inserir ~200 palavras com definições. Pode expandir esta lista depois!

### 3️⃣ Deploy da Edge Function

No terminal, na raiz do projeto:

```bash
# Login no Supabase (se ainda não fez)
supabase login

# Link ao projeto
supabase link --project-ref your-project-ref

# Deploy da função
supabase functions deploy generate-daily-crossword
```

### 4️⃣ Configurar Secrets no Vault

No Supabase Dashboard → Project Settings → Vault, adicione:

1. **Nome:** `project_url`  
   **Valor:** `https://your-project.supabase.co`

2. **Nome:** `service_role_key`  
   **Valor:** (encontrar em Project Settings → API → service_role key)

⚠️ **IMPORTANTE:** Use o `service_role_key`, não o `anon_key`!

### 5️⃣ Ativar o Cron Job

Agora sim, execute a migration do cron:

```sql
-- Execute no Supabase SQL Editor
supabase/migrations/003_schedule_daily_crossword.sql
```

Verifique que foi criado:

```sql
SELECT * FROM cron.job WHERE jobname = 'generate-daily-crossword';
```

### 6️⃣ Testar Manualmente (Opcional)

Pode testar a função antes de esperar até à meia-noite:

```bash
# Método 1: Via Supabase Dashboard
# → Edge Functions → generate-daily-crossword → "Invoke Function"

# Método 2: Via curl
curl -X POST \
  'https://your-project.supabase.co/functions/v1/generate-daily-crossword' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

Verifique se o puzzle foi criado:

```sql
SELECT * FROM puzzles WHERE type = 'daily' ORDER BY created_at DESC LIMIT 1;
```

## 🔧 Troubleshooting

### Erro: "No words found in dictionary"
- Confirme que executou `portuguese_words.sql`
- Verifique: `SELECT COUNT(*) FROM dictionary_pt;` (deve ser > 0)

### Erro: "Failed to fetch words"
- Verifique as permissões RLS na tabela `dictionary_pt`
- A função usa `service_role_key` que bypassa RLS

### Erro: "Failed to insert puzzle"
- Verifique o schema da tabela `puzzles`
- Confirme que os campos JSONB estão corretos

### Cron não está a executar
- Verifique: `SELECT * FROM cron.job;`
- Confirme que as extensions estão ativas: `pg_cron`, `pg_net`
- Verifique os secrets no Vault

### Ver logs de execução
```sql
-- Ver últimas execuções do cron
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-crossword')
ORDER BY start_time DESC 
LIMIT 10;
```

## 📈 Expandir a Lista de Palavras

Para adicionar mais palavras (recomendado: 500-1000):

```sql
INSERT INTO dictionary_pt (word, definition) VALUES
('palavra1', 'Definição clara e concisa'),
('palavra2', 'Outra definição tipo pista'),
('palavra3', 'Mais uma definição');
```

**Regras:**
- Palavras com 3-10 caracteres
- Definições curtas (tipo pista de palavras cruzadas)
- PT-PT (não PT-BR)
- Palavras em minúsculas

## 🔄 Como Funciona

1. **00:00 (Portugal):** `pg_cron` dispara o cron job
2. **HTTP POST:** Chama a Edge Function via `pg_net`
3. **Fetch Words:** Função busca 100 palavras aleatórias
4. **Generate:** Algoritmo cria grelha 15x15 com intersecções
5. **Retry:** Até 5 tentativas se a geração falhar
6. **Insert:** Puzzle inserido na tabela `puzzles`
7. **Frontend:** Busca o puzzle mais recente do tipo 'daily'

## 📊 Monitorização

Ver puzzles gerados:
```sql
SELECT 
  id, 
  publish_date, 
  jsonb_array_length(clues->'across') + jsonb_array_length(clues->'down') as total_words,
  created_at
FROM puzzles 
WHERE type = 'daily' 
ORDER BY publish_date DESC 
LIMIT 7; -- Última semana
```

## 🎯 Próximos Passos

1. ✅ Deployment completo
2. 🔄 Conectar frontend para buscar puzzles da API
3. 📊 Implementar página de leaderboards
4. 🔐 Adicionar autenticação
5. 📈 Expandir dicionário para 1000+ palavras

## 📝 Notas Importantes

- A timezone é **Europe/Lisbon** (Portugal)
- Apenas **1 puzzle por dia** é gerado
- Se já existir puzzle para hoje, a função não cria duplicado
- O `service_role_key` tem acesso total - guardar com segurança no Vault
- Logs da função aparecem no Supabase Dashboard → Edge Functions → Logs

## 🆘 Suporte

Se tiver problemas:
1. Verificar logs da Edge Function no Dashboard
2. Verificar `cron.job_run_details` para erros do cron
3. Testar manualmente a função primeiro
4. Confirmar que todos os secrets estão no Vault
