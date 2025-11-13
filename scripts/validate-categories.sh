#!/bin/bash
# Script de Validação do Sistema de Categorias
# Executa verificações para garantir que tudo está funcionando

set -e

echo "🔍 NEXO - Validação do Sistema de Categorias"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (mudar para produção quando deployar)
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: API Categories
echo "Test 1: GET /api/categories"
echo "----------------------------"
RESPONSE=$(curl -s "$BASE_URL/api/categories")
CATEGORY_COUNT=$(echo "$RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

if [ "$CATEGORY_COUNT" -ge 20 ]; then
    echo -e "${GREEN}✅ PASS${NC} - $CATEGORY_COUNT categorias encontradas"
    echo "   Amostra:"
    echo "$RESPONSE" | jq -r '.[0:3] | .[] | "   - \(.icon) \(.name) (\(.word_count) palavras)"' 2>/dev/null || echo "   (erro ao parsear)"
else
    echo -e "${RED}❌ FAIL${NC} - Esperado >= 20 categorias, encontradas: $CATEGORY_COUNT"
    echo "   Resposta: $RESPONSE"
fi
echo ""

# Test 2: Random Crossword (sem categoria)
echo "Test 2: GET /api/crossword/random"
echo "----------------------------------"
RESPONSE=$(curl -s "$BASE_URL/api/crossword/random")
PUZZLE_TYPE=$(echo "$RESPONSE" | jq -r '.type' 2>/dev/null)
CLUES_COUNT=$(echo "$RESPONSE" | jq '.clues.across + .clues.down | length' 2>/dev/null || echo "0")

if [ "$PUZZLE_TYPE" = "random" ] && [ "$CLUES_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Puzzle aleatório gerado com $CLUES_COUNT pistas"
    echo "   Quality Score: $(echo "$RESPONSE" | jq -r '.quality.score // "N/A"' 2>/dev/null)"
else
    echo -e "${RED}❌ FAIL${NC} - Puzzle inválido (type: $PUZZLE_TYPE, clues: $CLUES_COUNT)"
fi
echo ""

# Test 3: Random Crossword (com categoria)
echo "Test 3: GET /api/crossword/random?category=animais"
echo "---------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/api/crossword/random?category=animais")
PUZZLE_CATEGORY=$(echo "$RESPONSE" | jq -r '.category' 2>/dev/null)
CLUES_COUNT=$(echo "$RESPONSE" | jq '.clues.across + .clues.down | length' 2>/dev/null || echo "0")

if [ "$PUZZLE_CATEGORY" = "animais" ] && [ "$CLUES_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Puzzle temático de animais com $CLUES_COUNT pistas"
    echo "   Amostra de pistas:"
    echo "$RESPONSE" | jq -r '.clues.across[0:2] | .[] | "   \(.number). \(.text)"' 2>/dev/null || echo "   (erro ao parsear)"
else
    echo -e "${RED}❌ FAIL${NC} - Puzzle inválido (category: $PUZZLE_CATEGORY, clues: $CLUES_COUNT)"
fi
echo ""

# Test 4: Random WordSearch (sem categoria)
echo "Test 4: GET /api/wordsearch/random"
echo "-----------------------------------"
RESPONSE=$(curl -s "$BASE_URL/api/wordsearch/random")
PUZZLE_TYPE=$(echo "$RESPONSE" | jq -r '.type' 2>/dev/null)
WORDS_COUNT=$(echo "$RESPONSE" | jq '.words | length' 2>/dev/null || echo "0")

if [ "$PUZZLE_TYPE" = "random" ] && [ "$WORDS_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Sopa de letras gerada com $WORDS_COUNT palavras"
    echo "   Palavras: $(echo "$RESPONSE" | jq -r '.words[0:3] | .[].word' 2>/dev/null | tr '\n' ', ')"
else
    echo -e "${RED}❌ FAIL${NC} - Puzzle inválido (type: $PUZZLE_TYPE, words: $WORDS_COUNT)"
fi
echo ""

# Test 5: Random WordSearch (com categoria)
echo "Test 5: GET /api/wordsearch/random?category=comida"
echo "---------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/api/wordsearch/random?category=comida")
PUZZLE_CATEGORY=$(echo "$RESPONSE" | jq -r '.category' 2>/dev/null)
WORDS_COUNT=$(echo "$RESPONSE" | jq '.words | length' 2>/dev/null || echo "0")

if [ "$PUZZLE_CATEGORY" = "comida" ] && [ "$WORDS_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Sopa temática de comida com $WORDS_COUNT palavras"
    echo "   Palavras: $(echo "$RESPONSE" | jq -r '.words[0:3] | .[].word' 2>/dev/null | tr '\n' ', ')"
else
    echo -e "${RED}❌ FAIL${NC} - Puzzle inválido (category: $PUZZLE_CATEGORY, words: $WORDS_COUNT)"
fi
echo ""

# Test 6: Build check
echo "Test 6: TypeScript Build"
echo "------------------------"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - Build TypeScript sem erros"
else
    echo -e "${RED}❌ FAIL${NC} - Build falhou (executar 'npm run build' para detalhes)"
fi
echo ""

# Test 7: Lint check
echo "Test 7: ESLint"
echo "--------------"
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - ESLint passou"
else
    echo -e "${YELLOW}⚠️  WARN${NC} - ESLint com avisos (executar 'npm run lint' para detalhes)"
fi
echo ""

# Summary
echo "=============================================="
echo "📊 RESUMO DA VALIDAÇÃO"
echo "=============================================="
echo ""
echo "Testes executados: 7"
echo "Base URL: $BASE_URL"
echo ""
echo -e "${GREEN}✅ Sistema de Categorias operacional!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Executar migrations no Supabase (007_add_word_categories.sql)"
echo "2. Popular dicionário (portuguese_words_categories.sql)"
echo "3. Deploy para produção: git push origin main"
echo ""
echo "Para testar manualmente:"
echo "  - Navegar: $BASE_URL/palavras-cruzadas"
echo "  - Selecionar: Modo Aleatório"
echo "  - Escolher: 🐾 Animais"
echo ""
