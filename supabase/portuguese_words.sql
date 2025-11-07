-- Portuguese (PT-PT) Dictionary with Definitions
-- This file contains a curated list of Portuguese words with their definitions
-- for automatic crossword generation.
--
-- INSTRUCTIONS FOR EXPANDING THIS LIST:
-- 1. Use PT-PT Portuguese (Portugal, not Brazil)
-- 2. Words should be 3-10 characters long
-- 3. Definitions should be clear, concise clues (not full dictionary definitions)
-- 4. Format: INSERT INTO dictionary_pt (word, definition) VALUES ('word', 'definition');
-- 5. Words are stored in lowercase
--
-- SOURCES:
-- - LibreOffice PT-PT dictionary (open-source)
-- - Dicionário Priberam da Língua Portuguesa
-- - Manual curation for quality clues
--
-- TODO: Expand this list to 1000+ words for better variety

-- Common words (3-4 letters)
INSERT INTO dictionary_pt (word, definition) VALUES
('casa', 'Habitação, moradia'),
('café', 'Bebida estimulante escura'),
('fado', 'Género musical português'),
('olá', 'Saudação informal'),
('ano', 'Período de 365 dias'),
('água', 'Líquido transparente essencial à vida'),
('amor', 'Sentimento de afeto profundo'),
('arte', 'Expressão criativa humana'),
('azul', 'Cor do céu'),
('bolo', 'Doce de festa'),
('cão', 'Animal de estimação que ladra'),
('dor', 'Sensação física desagradável'),
('fogo', 'Elemento que queima'),
('lua', 'Satélite natural da Terra'),
('mar', 'Grande extensão de água salgada'),
('mãe', 'Progenitora feminina'),
('nó', 'Laço apertado'),
('pão', 'Alimento básico de farinha'),
('sol', 'Estrela do sistema solar'),
('sal', 'Condimento branco'),
('rua', 'Via pública na cidade'),
('rio', 'Curso de água doce'),
('paz', 'Ausência de conflito'),
('voz', 'Som produzido ao falar'),
('luz', 'Claridade, iluminação'),
('cor', 'Qualidade visual dos objetos'),
('céu', 'Espaço acima da Terra'),
('rei', 'Monarca masculino'),
('lei', 'Norma jurídica'),
('mão', 'Extremidade do braço');

-- Medium words (5-6 letters)
INSERT INTO dictionary_pt (word, definition) VALUES
('amigo', 'Pessoa com quem se tem afeto'),
('banco', 'Instituição financeira'),
('barco', 'Embarcação'),
('branco', 'Cor da neve'),
('campo', 'Terreno rural'),
('carro', 'Veículo automóvel'),
('carta', 'Mensagem escrita'),
('cidade', 'Aglomerado urbano'),
('dente', 'Estrutura dura na boca'),
('escola', 'Local de ensino'),
('festa', 'Celebração social'),
('flor', 'Parte colorida da planta'),
('gato', 'Felino doméstico'),
('igreja', 'Templo cristão'),
('janela', 'Abertura na parede'),
('jardim', 'Espaço com plantas'),
('livro', 'Conjunto de páginas escritas'),
('mesa', 'Móvel com tampo horizontal'),
('monte', 'Elevação de terreno'),
('nariz', 'Órgão do olfato'),
('neve', 'Água congelada que cai do céu'),
('noite', 'Período sem luz solar'),
('olho', 'Órgão da visão'),
('peixe', 'Animal aquático com escamas'),
('pedra', 'Fragmento de rocha'),
('ponte', 'Estrutura sobre rio'),
('porta', 'Entrada de uma divisão'),
('prato', 'Utensílio para comer'),
('praia', 'Margem arenosa do mar'),
('tempo', 'Duração dos acontecimentos'),
('terra', 'Planeta onde vivemos'),
('torre', 'Construção alta'),
('verde', 'Cor da relva'),
('vento', 'Movimento do ar'),
('vidro', 'Material transparente'),
('vinho', 'Bebida alcoólica de uvas');

-- Longer words (7-10 letters)
INSERT INTO dictionary_pt (word, definition) VALUES
('amanhã', 'Dia seguinte'),
('animal', 'Ser vivo não vegetal'),
('árvore', 'Planta de grande porte'),
('avião', 'Veículo aéreo'),
('bandeira', 'Símbolo nacional'),
('cabelo', 'Pelo da cabeça'),
('cadeira', 'Assento com encosto'),
('canção', 'Música com letra'),
('comida', 'Alimento'),
('coração', 'Órgão que bombeia sangue'),
('criança', 'Ser humano jovem'),
('domingo', 'Último dia da semana'),
('família', 'Grupo de parentes'),
('história', 'Relato de eventos passados'),
('inverno', 'Estação fria do ano'),
('jantar', 'Refeição da noite'),
('laranja', 'Fruto cítrico'),
('liberdade', 'Estado de ser livre'),
('manhã', 'Período inicial do dia'),
('mercado', 'Local de comércio'),
('montanha', 'Grande elevação natural'),
('música', 'Arte dos sons'),
('natureza', 'Mundo físico natural'),
('número', 'Símbolo matemático'),
('oceano', 'Grande massa de água'),
('palavra', 'Unidade da língua'),
('pessoa', 'Ser humano individual'),
('planeta', 'Corpo celeste'),
('problema', 'Questão a resolver'),
('presente', 'Momento atual ou oferta'),
('quintal', 'Terreno junto à casa'),
('semana', 'Período de sete dias'),
('trabalho', 'Atividade laboral'),
('universidade', 'Instituição de ensino superior'),
('viagem', 'Deslocação a outro lugar'),
('vitória', 'Triunfo em competição'),
('segunda', 'Primeiro dia útil'),
('terça', 'Segundo dia útil'),
('quarta', 'Terceiro dia útil'),
('quinta', 'Quarto dia útil'),
('sexta', 'Quinto dia útil'),
('sábado', 'Sexto dia da semana');

-- Verbs (infinitive form)
INSERT INTO dictionary_pt (word, definition) VALUES
('amar', 'Sentir amor'),
('comer', 'Ingerir alimentos'),
('beber', 'Ingerir líquidos'),
('andar', 'Mover-se a pé'),
('correr', 'Mover-se rapidamente'),
('falar', 'Comunicar por palavras'),
('ouvir', 'Perceber sons'),
('ver', 'Perceber pela visão'),
('ler', 'Interpretar texto escrito'),
('escrever', 'Produzir texto'),
('dormir', 'Repousar'),
('acordar', 'Despertar do sono'),
('cantar', 'Produzir música vocal'),
('dançar', 'Mover-se ao ritmo'),
('jogar', 'Participar em jogo'),
('pensar', 'Usar a mente'),
('sentir', 'Ter sensação'),
('viver', 'Estar vivo'),
('morrer', 'Cessar de viver'),
('nascer', 'Vir ao mundo');

-- Adjectives
INSERT INTO dictionary_pt (word, definition) VALUES
('alto', 'De grande altura'),
('baixo', 'De pequena altura'),
('bom', 'De qualidade positiva'),
('mau', 'De qualidade negativa'),
('grande', 'De tamanho avantajado'),
('pequeno', 'De tamanho reduzido'),
('novo', 'Recente ou jovem'),
('velho', 'Antigo ou idoso'),
('feliz', 'Que sente alegria'),
('triste', 'Que sente tristeza'),
('quente', 'De temperatura elevada'),
('frio', 'De temperatura baixa'),
('rápido', 'De velocidade alta'),
('lento', 'De velocidade baixa'),
('forte', 'Com grande força'),
('fraco', 'Com pouca força'),
('doce', 'De sabor açucarado'),
('amargo', 'De sabor acre'),
('duro', 'Não macio'),
('macio', 'Suave ao toque');

-- Portuguese culture and geography
INSERT INTO dictionary_pt (word, definition) VALUES
('lisboa', 'Capital de Portugal'),
('porto', 'Segunda maior cidade portuguesa'),
('algarve', 'Região sul de Portugal'),
('minho', 'Região norte de Portugal'),
('douro', 'Rio português famoso'),
('tejo', 'Rio de Lisboa'),
('bacalhau', 'Peixe tradicional português'),
('pastéis', 'Doces de Belém'),
('azulejo', 'Cerâmica decorativa portuguesa'),
('sardinha', 'Peixe típico das festas'),
('castelo', 'Fortificação medieval'),
('convento', 'Mosteiro religioso');

-- NOTE: To add more words, use the same INSERT format above
-- Aim for at least 500-1000 words for good variety in daily puzzles
-- Keep definitions short and suitable as crossword clues
-- All words must be in PT-PT Portuguese (European Portuguese)
