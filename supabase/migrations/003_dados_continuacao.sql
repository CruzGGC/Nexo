-- ============================================================================
-- NEXO - Dados Iniciais (Continuação)
-- ============================================================================
-- Este é a continuação de 002_dados_iniciais.sql
-- Executar APÓS 002_dados_iniciais.sql
--
-- Contém as restantes 17 categorias (~400 palavras)
-- ============================================================================

-- Guard: assegurar que a função auxiliar existe (evita erro obscuro de overload)

-- Idempotent function definition: garante que a função existe se este ficheiro for executado sozinho
CREATE OR REPLACE FUNCTION public.insert_word_with_categories(
  p_word TEXT,
  p_definition TEXT,
  p_category_slugs TEXT[]
) RETURNS void AS $$
DECLARE
  v_slug TEXT;
  v_category_id UUID;
BEGIN
  -- Inserir palavra no dicionário (ignora se já existe)
  INSERT INTO public.dictionary_pt (word, definition)
  VALUES (p_word, p_definition)
  ON CONFLICT (word) DO NOTHING;
  
  -- Associar categorias (converter slug para UUID)
  FOREACH v_slug IN ARRAY p_category_slugs
  LOOP
    -- Obter UUID da categoria pelo slug
    SELECT id INTO v_category_id 
    FROM public.word_categories 
    WHERE slug = v_slug;
    
    -- Inserir associação se categoria existe
    IF v_category_id IS NOT NULL THEN
      INSERT INTO public.dictionary_categories (word, category_id)
      VALUES (p_word, v_category_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 2.4 CATEGORIA: NATUREZA (40 palavras)
-- ============================================================================

SELECT insert_word_with_categories('árvore', 'Planta grande com tronco', ARRAY['natureza']);
SELECT insert_word_with_categories('flor', 'Parte colorida da planta', ARRAY['natureza']);
SELECT insert_word_with_categories('rosa', 'Flor perfumada com espinhos', ARRAY['natureza']);
SELECT insert_word_with_categories('folha', 'Parte verde da planta', ARRAY['natureza']);
SELECT insert_word_with_categories('raiz', 'Parte subterrânea da planta', ARRAY['natureza']);
SELECT insert_word_with_categories('tronco', 'Caule da árvore', ARRAY['natureza']);
SELECT insert_word_with_categories('ramo', 'Parte ramificada da árvore', ARRAY['natureza']);
SELECT insert_word_with_categories('semente', 'Grão que origina planta', ARRAY['natureza']);
SELECT insert_word_with_categories('fruto', 'Produto comestível da planta', ARRAY['natureza']);
SELECT insert_word_with_categories('relva', 'Grama verde do jardim', ARRAY['natureza']);
SELECT insert_word_with_categories('montanha', 'Elevação grande de terra', ARRAY['natureza', 'geografia']);
SELECT insert_word_with_categories('rio', 'Curso de água doce', ARRAY['natureza', 'geografia']);
SELECT insert_word_with_categories('mar', 'Grande massa de água salgada', ARRAY['natureza']);
SELECT insert_word_with_categories('praia', 'Costa arenosa junto ao mar', ARRAY['natureza', 'portugal']);
SELECT insert_word_with_categories('oceano', 'Maior massa de água', ARRAY['natureza']);
SELECT insert_word_with_categories('lago', 'Massa de água interior', ARRAY['natureza']);
SELECT insert_word_with_categories('floresta', 'Grande área de árvores', ARRAY['natureza']);
SELECT insert_word_with_categories('selva', 'Floresta tropical densa', ARRAY['natureza']);
SELECT insert_word_with_categories('deserto', 'Área árida e seca', ARRAY['natureza']);
SELECT insert_word_with_categories('ilha', 'Terra rodeada de água', ARRAY['natureza', 'geografia']);
SELECT insert_word_with_categories('vulcão', 'Montanha que expele lava', ARRAY['natureza', 'geografia']);
SELECT insert_word_with_categories('caverna', 'Gruta natural subterrânea', ARRAY['natureza']);
SELECT insert_word_with_categories('rocha', 'Pedra grande natural', ARRAY['natureza']);
SELECT insert_word_with_categories('pedra', 'Fragmento mineral duro', ARRAY['natureza']);
SELECT insert_word_with_categories('areia', 'Grãos finos da praia', ARRAY['natureza']);
SELECT insert_word_with_categories('terra', 'Solo onde crescem plantas', ARRAY['natureza']);
SELECT insert_word_with_categories('chuva', 'Água que cai do céu', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('neve', 'Precipitação congelada', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('vento', 'Movimento do ar', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('trovão', 'Som alto da tempestade', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('raio', 'Descarga elétrica do céu', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('nuvem', 'Massa de vapor no céu', ARRAY['natureza']);
SELECT insert_word_with_categories('sol', 'Estrela do sistema solar', ARRAY['natureza', 'ciencia']);
SELECT insert_word_with_categories('lua', 'Satélite natural da Terra', ARRAY['natureza', 'ciencia']);
SELECT insert_word_with_categories('estrela', 'Corpo celeste luminoso', ARRAY['natureza', 'ciencia']);
SELECT insert_word_with_categories('céu', 'Espaço acima da Terra', ARRAY['natureza']);
SELECT insert_word_with_categories('nevoeiro', 'Neblina densa', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('orvalho', 'Gotas de água da madrugada', ARRAY['natureza']);
SELECT insert_word_with_categories('geada', 'Gelo fino da manhã', ARRAY['natureza', 'tempo']);
SELECT insert_word_with_categories('cascata', 'Queda de água vertical', ARRAY['natureza']);

-- ============================================================================
-- 2.5 CATEGORIA: CORPO HUMANO (30 palavras)
-- ============================================================================

SELECT insert_word_with_categories('cabeça', 'Parte superior do corpo', ARRAY['corpo']);
SELECT insert_word_with_categories('olho', 'Órgão da visão', ARRAY['corpo']);
SELECT insert_word_with_categories('nariz', 'Órgão do olfato', ARRAY['corpo']);
SELECT insert_word_with_categories('boca', 'Órgão da fala e alimentação', ARRAY['corpo']);
SELECT insert_word_with_categories('orelha', 'Órgão da audição', ARRAY['corpo']);
SELECT insert_word_with_categories('dente', 'Estrutura para mastigar', ARRAY['corpo']);
SELECT insert_word_with_categories('língua', 'Órgão do paladar', ARRAY['corpo']);
SELECT insert_word_with_categories('pescoço', 'Liga cabeça ao tronco', ARRAY['corpo']);
SELECT insert_word_with_categories('ombro', 'Parte superior do braço', ARRAY['corpo']);
SELECT insert_word_with_categories('braço', 'Membro superior', ARRAY['corpo']);
SELECT insert_word_with_categories('cotovelo', 'Articulação do braço', ARRAY['corpo']);
SELECT insert_word_with_categories('mão', 'Extremidade do braço', ARRAY['corpo']);
SELECT insert_word_with_categories('dedo', 'Parte extrema da mão', ARRAY['corpo']);
SELECT insert_word_with_categories('unha', 'Proteção na ponta do dedo', ARRAY['corpo']);
SELECT insert_word_with_categories('peito', 'Parte frontal do tórax', ARRAY['corpo']);
SELECT insert_word_with_categories('costas', 'Parte traseira do tronco', ARRAY['corpo']);
SELECT insert_word_with_categories('barriga', 'Região do abdómen', ARRAY['corpo']);
SELECT insert_word_with_categories('perna', 'Membro inferior', ARRAY['corpo']);
SELECT insert_word_with_categories('joelho', 'Articulação da perna', ARRAY['corpo']);
SELECT insert_word_with_categories('pé', 'Extremidade da perna', ARRAY['corpo']);
SELECT insert_word_with_categories('calcanhar', 'Parte traseira do pé', ARRAY['corpo']);
SELECT insert_word_with_categories('coração', 'Órgão que bombeia sangue', ARRAY['corpo']);
SELECT insert_word_with_categories('pulmão', 'Órgão da respiração', ARRAY['corpo']);
SELECT insert_word_with_categories('cérebro', 'Órgão do pensamento', ARRAY['corpo']);
SELECT insert_word_with_categories('estômago', 'Órgão da digestão', ARRAY['corpo']);
SELECT insert_word_with_categories('fígado', 'Órgão de filtração', ARRAY['corpo']);
SELECT insert_word_with_categories('rim', 'Órgão de purificação', ARRAY['corpo']);
SELECT insert_word_with_categories('osso', 'Estrutura do esqueleto', ARRAY['corpo']);
SELECT insert_word_with_categories('músculo', 'Tecido que produz movimento', ARRAY['corpo']);
SELECT insert_word_with_categories('pele', 'Camada externa do corpo', ARRAY['corpo']);

-- ============================================================================
-- 2.6 CATEGORIA: CASA E LAR (35 palavras)
-- ============================================================================

SELECT insert_word_with_categories('casa', 'Habitação, moradia', ARRAY['casa']);
SELECT insert_word_with_categories('porta', 'Entrada da divisão', ARRAY['casa']);
SELECT insert_word_with_categories('janela', 'Abertura com vidro', ARRAY['casa']);
SELECT insert_word_with_categories('parede', 'Estrutura vertical', ARRAY['casa']);
SELECT insert_word_with_categories('teto', 'Parte superior da divisão', ARRAY['casa']);
SELECT insert_word_with_categories('chão', 'Superfície inferior', ARRAY['casa']);
SELECT insert_word_with_categories('escada', 'Degraus para subir', ARRAY['casa']);
SELECT insert_word_with_categories('quarto', 'Divisão para dormir', ARRAY['casa']);
SELECT insert_word_with_categories('sala', 'Divisão de estar', ARRAY['casa']);
SELECT insert_word_with_categories('cozinha', 'Divisão para cozinhar', ARRAY['casa']);
SELECT insert_word_with_categories('casa de banho', 'Divisão de higiene', ARRAY['casa']);
SELECT insert_word_with_categories('garagem', 'Abrigo para carro', ARRAY['casa']);
SELECT insert_word_with_categories('jardim', 'Área verde exterior', ARRAY['casa', 'natureza']);
SELECT insert_word_with_categories('varanda', 'Área externa elevada', ARRAY['casa']);
SELECT insert_word_with_categories('cama', 'Móvel para dormir', ARRAY['casa']);
SELECT insert_word_with_categories('sofá', 'Assento acolchoado longo', ARRAY['casa']);
SELECT insert_word_with_categories('mesa', 'Superfície horizontal', ARRAY['casa']);
SELECT insert_word_with_categories('cadeira', 'Assento individual', ARRAY['casa']);
SELECT insert_word_with_categories('armário', 'Móvel de arrumação', ARRAY['casa']);
SELECT insert_word_with_categories('estante', 'Móvel para livros', ARRAY['casa']);
SELECT insert_word_with_categories('frigorífico', 'Aparelho para refrigerar', ARRAY['casa']);
SELECT insert_word_with_categories('fogão', 'Aparelho para cozinhar', ARRAY['casa']);
SELECT insert_word_with_categories('forno', 'Aparelho para assar', ARRAY['casa']);
SELECT insert_word_with_categories('máquina', 'Aparelho mecânico', ARRAY['casa', 'tecnologia']);
SELECT insert_word_with_categories('televisão', 'Aparelho de imagem', ARRAY['casa', 'tecnologia']);
SELECT insert_word_with_categories('espelho', 'Superfície refletora', ARRAY['casa']);
SELECT insert_word_with_categories('tapete', 'Cobertura de chão', ARRAY['casa']);
SELECT insert_word_with_categories('cortina', 'Tecido para janela', ARRAY['casa']);
SELECT insert_word_with_categories('lâmpada', 'Fonte de luz artificial', ARRAY['casa']);
SELECT insert_word_with_categories('vela', 'Fonte de luz com cera', ARRAY['casa']);
SELECT insert_word_with_categories('almofada', 'Acessório macio', ARRAY['casa']);
SELECT insert_word_with_categories('cobertor', 'Tecido para aquecer', ARRAY['casa']);
SELECT insert_word_with_categories('lençol', 'Tecido da cama', ARRAY['casa']);
SELECT insert_word_with_categories('toalha', 'Tecido para secar', ARRAY['casa']);
SELECT insert_word_with_categories('prato', 'Utensílio para comer', ARRAY['casa']);

-- ============================================================================
-- 2.7 CATEGORIA: VIAGEM E TRANSPORTES (30 palavras)
-- ============================================================================

SELECT insert_word_with_categories('carro', 'Veículo automóvel', ARRAY['viagem']);
SELECT insert_word_with_categories('autocarro', 'Veículo público de passageiros', ARRAY['viagem']);
SELECT insert_word_with_categories('comboio', 'Veículo sobre carris', ARRAY['viagem']);
SELECT insert_word_with_categories('avião', 'Veículo aéreo', ARRAY['viagem']);
SELECT insert_word_with_categories('barco', 'Veículo aquático', ARRAY['viagem']);
SELECT insert_word_with_categories('navio', 'Grande embarcação', ARRAY['viagem']);
SELECT insert_word_with_categories('bicicleta', 'Veículo de duas rodas', ARRAY['viagem', 'desporto']);
SELECT insert_word_with_categories('mota', 'Veículo motorizado de duas rodas', ARRAY['viagem']);
SELECT insert_word_with_categories('camião', 'Veículo de carga', ARRAY['viagem']);
SELECT insert_word_with_categories('táxi', 'Carro de aluguer', ARRAY['viagem']);
SELECT insert_word_with_categories('metro', 'Comboio subterrâneo', ARRAY['viagem']);
SELECT insert_word_with_categories('elétrico', 'Veículo sobre carris urbanos', ARRAY['viagem', 'portugal']);
SELECT insert_word_with_categories('helicóptero', 'Veículo aéreo com hélices', ARRAY['viagem']);
SELECT insert_word_with_categories('foguete', 'Veículo espacial', ARRAY['viagem', 'ciencia']);
SELECT insert_word_with_categories('balão', 'Veículo aéreo leve', ARRAY['viagem']);
SELECT insert_word_with_categories('estrada', 'Via para veículos', ARRAY['viagem']);
SELECT insert_word_with_categories('rua', 'Via urbana', ARRAY['viagem']);
SELECT insert_word_with_categories('avenida', 'Rua larga', ARRAY['viagem']);
SELECT insert_word_with_categories('praça', 'Espaço público aberto', ARRAY['viagem']);
SELECT insert_word_with_categories('ponte', 'Estrutura sobre água', ARRAY['viagem']);
SELECT insert_word_with_categories('túnel', 'Passagem subterrânea', ARRAY['viagem']);
SELECT insert_word_with_categories('aeroporto', 'Terminal de aviões', ARRAY['viagem']);
SELECT insert_word_with_categories('porto', 'Terminal de barcos', ARRAY['viagem']);
SELECT insert_word_with_categories('estação', 'Terminal de comboios', ARRAY['viagem']);
SELECT insert_word_with_categories('paragem', 'Local de parar', ARRAY['viagem']);
SELECT insert_word_with_categories('hotel', 'Alojamento temporário', ARRAY['viagem']);
SELECT insert_word_with_categories('mapa', 'Representação geográfica', ARRAY['viagem', 'geografia']);
SELECT insert_word_with_categories('bilhete', 'Documento de viagem', ARRAY['viagem']);
SELECT insert_word_with_categories('mala', 'Contentor para roupa', ARRAY['viagem']);
SELECT insert_word_with_categories('viagem', 'Deslocação longa', ARRAY['viagem']);

-- ============================================================================
-- 2.8 CATEGORIA: PROFISSÕES (30 palavras)
-- ============================================================================

SELECT insert_word_with_categories('médico', 'Profissional de saúde', ARRAY['profissoes']);
SELECT insert_word_with_categories('enfermeiro', 'Assistente de saúde', ARRAY['profissoes']);
SELECT insert_word_with_categories('professor', 'Educador de alunos', ARRAY['profissoes']);
SELECT insert_word_with_categories('engenheiro', 'Profissional técnico', ARRAY['profissoes']);
SELECT insert_word_with_categories('arquiteto', 'Projetista de edifícios', ARRAY['profissoes']);
SELECT insert_word_with_categories('advogado', 'Profissional de direito', ARRAY['profissoes']);
SELECT insert_word_with_categories('juiz', 'Magistrado judicial', ARRAY['profissoes']);
SELECT insert_word_with_categories('polícia', 'Agente de segurança', ARRAY['profissoes']);
SELECT insert_word_with_categories('bombeiro', 'Combatente de incêndios', ARRAY['profissoes']);
SELECT insert_word_with_categories('soldado', 'Militar das forças', ARRAY['profissoes']);
SELECT insert_word_with_categories('piloto', 'Condutor de aeronaves', ARRAY['profissoes']);
SELECT insert_word_with_categories('capitão', 'Comandante de navio', ARRAY['profissoes']);
SELECT insert_word_with_categories('motorista', 'Condutor de veículos', ARRAY['profissoes']);
SELECT insert_word_with_categories('chef', 'Cozinheiro profissional', ARRAY['profissoes']);
SELECT insert_word_with_categories('padeiro', 'Fabricante de pão', ARRAY['profissoes']);
SELECT insert_word_with_categories('agricultor', 'Trabalhador do campo', ARRAY['profissoes']);
SELECT insert_word_with_categories('pescador', 'Capturador de peixe', ARRAY['profissoes']);
SELECT insert_word_with_categories('carpinteiro', 'Trabalhador de madeira', ARRAY['profissoes']);
SELECT insert_word_with_categories('pedreiro', 'Construtor de paredes', ARRAY['profissoes']);
SELECT insert_word_with_categories('eletricista', 'Técnico de eletricidade', ARRAY['profissoes']);
SELECT insert_word_with_categories('canalizador', 'Técnico de tubagens', ARRAY['profissoes']);
SELECT insert_word_with_categories('mecânico', 'Reparador de máquinas', ARRAY['profissoes']);
SELECT insert_word_with_categories('dentista', 'Médico dos dentes', ARRAY['profissoes']);
SELECT insert_word_with_categories('veterinário', 'Médico de animais', ARRAY['profissoes']);
SELECT insert_word_with_categories('cientista', 'Investigador científico', ARRAY['profissoes', 'ciencia']);
SELECT insert_word_with_categories('artista', 'Criador de arte', ARRAY['profissoes', 'arte']);
SELECT insert_word_with_categories('músico', 'Criador de música', ARRAY['profissoes', 'musica']);
SELECT insert_word_with_categories('ator', 'Intérprete de papéis', ARRAY['profissoes', 'arte']);
SELECT insert_word_with_categories('escritor', 'Autor de textos', ARRAY['profissoes']);
SELECT insert_word_with_categories('jornalista', 'Profissional de notícias', ARRAY['profissoes']);

-- ============================================================================
-- 2.9 CATEGORIA: TECNOLOGIA (25 palavras)
-- ============================================================================

SELECT insert_word_with_categories('computador', 'Máquina de processar dados', ARRAY['tecnologia']);
SELECT insert_word_with_categories('telemóvel', 'Telefone portátil', ARRAY['tecnologia']);
SELECT insert_word_with_categories('internet', 'Rede mundial de dados', ARRAY['tecnologia']);
SELECT insert_word_with_categories('software', 'Programa informático', ARRAY['tecnologia']);
SELECT insert_word_with_categories('hardware', 'Componente físico', ARRAY['tecnologia']);
SELECT insert_word_with_categories('rato', 'Dispositivo apontador', ARRAY['tecnologia']);
SELECT insert_word_with_categories('teclado', 'Dispositivo de escrita', ARRAY['tecnologia']);
SELECT insert_word_with_categories('ecrã', 'Monitor de visualização', ARRAY['tecnologia']);
SELECT insert_word_with_categories('impressora', 'Dispositivo de impressão', ARRAY['tecnologia']);
SELECT insert_word_with_categories('câmara', 'Dispositivo fotográfico', ARRAY['tecnologia']);
SELECT insert_word_with_categories('microfone', 'Dispositivo de áudio', ARRAY['tecnologia']);
SELECT insert_word_with_categories('altifalante', 'Dispositivo de som', ARRAY['tecnologia']);
SELECT insert_word_with_categories('bateria', 'Fonte de energia portátil', ARRAY['tecnologia']);
SELECT insert_word_with_categories('cabo', 'Fio de ligação', ARRAY['tecnologia']);
SELECT insert_word_with_categories('disco', 'Dispositivo de armazenamento', ARRAY['tecnologia']);
SELECT insert_word_with_categories('memória', 'Componente de armazenamento', ARRAY['tecnologia']);
SELECT insert_word_with_categories('processador', 'Chip de computação', ARRAY['tecnologia']);
SELECT insert_word_with_categories('robot', 'Máquina automática', ARRAY['tecnologia']);
SELECT insert_word_with_categories('drone', 'Veículo aéreo não tripulado', ARRAY['tecnologia']);
SELECT insert_word_with_categories('satélite', 'Dispositivo orbital', ARRAY['tecnologia', 'ciencia']);
SELECT insert_word_with_categories('radar', 'Sistema de deteção', ARRAY['tecnologia']);
SELECT insert_word_with_categories('laser', 'Feixe de luz concentrado', ARRAY['tecnologia', 'ciencia']);
SELECT insert_word_with_categories('sensor', 'Dispositivo de deteção', ARRAY['tecnologia']);
SELECT insert_word_with_categories('código', 'Instruções de programa', ARRAY['tecnologia']);
SELECT insert_word_with_categories('aplicação', 'Programa para tarefa', ARRAY['tecnologia']);

-- ============================================================================
-- 2.10 CATEGORIA: ARTE E CULTURA (25 palavras)
-- ============================================================================

SELECT insert_word_with_categories('pintura', 'Arte de pintar', ARRAY['arte']);
SELECT insert_word_with_categories('escultura', 'Arte de esculpir', ARRAY['arte']);
SELECT insert_word_with_categories('desenho', 'Arte de desenhar', ARRAY['arte']);
SELECT insert_word_with_categories('fotografia', 'Arte de fotografar', ARRAY['arte']);
SELECT insert_word_with_categories('cinema', 'Arte dos filmes', ARRAY['arte']);
SELECT insert_word_with_categories('teatro', 'Arte cénica', ARRAY['arte']);
SELECT insert_word_with_categories('dança', 'Arte do movimento', ARRAY['arte']);
SELECT insert_word_with_categories('literatura', 'Arte da escrita', ARRAY['arte']);
SELECT insert_word_with_categories('poesia', 'Escrita em verso', ARRAY['arte']);
SELECT insert_word_with_categories('romance', 'Obra literária longa', ARRAY['arte']);
SELECT insert_word_with_categories('conto', 'Narrativa curta', ARRAY['arte']);
SELECT insert_word_with_categories('museu', 'Local de exposição', ARRAY['arte']);
SELECT insert_word_with_categories('galeria', 'Espaço de arte', ARRAY['arte']);
SELECT insert_word_with_categories('quadro', 'Pintura emoldurada', ARRAY['arte']);
SELECT insert_word_with_categories('estátua', 'Escultura de figura', ARRAY['arte']);
SELECT insert_word_with_categories('monumento', 'Obra comemorativa', ARRAY['arte', 'historia']);
SELECT insert_word_with_categories('castelo', 'Fortaleza medieval', ARRAY['arte', 'historia', 'portugal']);
SELECT insert_word_with_categories('palácio', 'Residência nobre', ARRAY['arte', 'historia']);
SELECT insert_word_with_categories('igreja', 'Templo religioso', ARRAY['arte', 'historia']);
SELECT insert_word_with_categories('catedral', 'Grande igreja', ARRAY['arte', 'historia']);
SELECT insert_word_with_categories('torre', 'Estrutura alta', ARRAY['arte']);
SELECT insert_word_with_categories('arco', 'Estrutura curva', ARRAY['arte']);
SELECT insert_word_with_categories('coluna', 'Pilar vertical', ARRAY['arte']);
SELECT insert_word_with_categories('mosaico', 'Arte de peças coloridas', ARRAY['arte']);
SELECT insert_word_with_categories('vitral', 'Vidro colorido artístico', ARRAY['arte']);

-- ============================================================================
-- 2.11 CATEGORIA: MÚSICA (25 palavras)
-- ============================================================================

SELECT insert_word_with_categories('guitarra', 'Instrumento de cordas', ARRAY['musica']);
SELECT insert_word_with_categories('piano', 'Instrumento de teclas', ARRAY['musica']);
SELECT insert_word_with_categories('violino', 'Instrumento de arco', ARRAY['musica']);
SELECT insert_word_with_categories('bateria', 'Instrumento de percussão', ARRAY['musica']);
SELECT insert_word_with_categories('flauta', 'Instrumento de sopro', ARRAY['musica']);
SELECT insert_word_with_categories('saxofone', 'Instrumento de sopro', ARRAY['musica']);
SELECT insert_word_with_categories('trompete', 'Instrumento de metal', ARRAY['musica']);
SELECT insert_word_with_categories('tambor', 'Instrumento de percussão', ARRAY['musica']);
SELECT insert_word_with_categories('harpa', 'Instrumento de cordas', ARRAY['musica']);
SELECT insert_word_with_categories('órgão', 'Instrumento de tubos', ARRAY['musica']);
SELECT insert_word_with_categories('gaita', 'Instrumento de sopro', ARRAY['musica', 'portugal']);
SELECT insert_word_with_categories('melodia', 'Sequência de sons', ARRAY['musica']);
SELECT insert_word_with_categories('ritmo', 'Padrão temporal', ARRAY['musica']);
SELECT insert_word_with_categories('harmonia', 'Combinação de sons', ARRAY['musica']);
SELECT insert_word_with_categories('nota', 'Som musical', ARRAY['musica']);
SELECT insert_word_with_categories('acorde', 'Conjunto de notas', ARRAY['musica']);
SELECT insert_word_with_categories('canção', 'Composição com letra', ARRAY['musica']);
SELECT insert_word_with_categories('sinfonia', 'Obra orquestral', ARRAY['musica']);
SELECT insert_word_with_categories('ópera', 'Drama musical', ARRAY['musica', 'arte']);
SELECT insert_word_with_categories('concerto', 'Apresentação musical', ARRAY['musica']);
SELECT insert_word_with_categories('orquestra', 'Conjunto de músicos', ARRAY['musica']);
SELECT insert_word_with_categories('coro', 'Grupo de cantores', ARRAY['musica']);
SELECT insert_word_with_categories('fado', 'Música tradicional portuguesa', ARRAY['musica', 'portugal']);
SELECT insert_word_with_categories('jazz', 'Género musical americano', ARRAY['musica']);
SELECT insert_word_with_categories('rock', 'Género musical enérgico', ARRAY['musica']);

-- ============================================================================
-- 2.12 CATEGORIA: CIÊNCIA (30 palavras)
-- ============================================================================

SELECT insert_word_with_categories('átomo', 'Partícula elementar', ARRAY['ciencia']);
SELECT insert_word_with_categories('molécula', 'Conjunto de átomos', ARRAY['ciencia']);
SELECT insert_word_with_categories('célula', 'Unidade de vida', ARRAY['ciencia']);
SELECT insert_word_with_categories('gene', 'Unidade de hereditariedade', ARRAY['ciencia']);
SELECT insert_word_with_categories('proteína', 'Molécula biológica', ARRAY['ciencia']);
SELECT insert_word_with_categories('energia', 'Capacidade de trabalho', ARRAY['ciencia']);
SELECT insert_word_with_categories('força', 'Interação física', ARRAY['ciencia']);
SELECT insert_word_with_categories('massa', 'Quantidade de matéria', ARRAY['ciencia']);
SELECT insert_word_with_categories('velocidade', 'Taxa de movimento', ARRAY['ciencia']);
SELECT insert_word_with_categories('aceleração', 'Mudança de velocidade', ARRAY['ciencia']);
SELECT insert_word_with_categories('gravidade', 'Força de atração', ARRAY['ciencia']);
SELECT insert_word_with_categories('eletricidade', 'Fluxo de eletrões', ARRAY['ciencia']);
SELECT insert_word_with_categories('magnetismo', 'Força magnética', ARRAY['ciencia']);
SELECT insert_word_with_categories('luz', 'Radiação visível', ARRAY['ciencia']);
SELECT insert_word_with_categories('som', 'Onda mecânica', ARRAY['ciencia']);
SELECT insert_word_with_categories('calor', 'Energia térmica', ARRAY['ciencia']);
SELECT insert_word_with_categories('temperatura', 'Grau de calor', ARRAY['ciencia']);
SELECT insert_word_with_categories('pressão', 'Força por área', ARRAY['ciencia']);
SELECT insert_word_with_categories('volume', 'Espaço ocupado', ARRAY['ciencia']);
SELECT insert_word_with_categories('densidade', 'Massa por volume', ARRAY['ciencia']);
SELECT insert_word_with_categories('químico', 'Relativo à química', ARRAY['ciencia']);
SELECT insert_word_with_categories('físico', 'Relativo à física', ARRAY['ciencia']);
SELECT insert_word_with_categories('biologia', 'Ciência da vida', ARRAY['ciencia']);
SELECT insert_word_with_categories('química', 'Ciência da matéria', ARRAY['ciencia']);
SELECT insert_word_with_categories('física', 'Ciência das leis naturais', ARRAY['ciencia']);
SELECT insert_word_with_categories('astronomia', 'Ciência dos astros', ARRAY['ciencia']);
SELECT insert_word_with_categories('geologia', 'Ciência da Terra', ARRAY['ciencia']);
SELECT insert_word_with_categories('ecologia', 'Ciência do ambiente', ARRAY['ciencia']);
SELECT insert_word_with_categories('teoria', 'Explicação científica', ARRAY['ciencia']);
SELECT insert_word_with_categories('experiência', 'Teste científico', ARRAY['ciencia']);

-- ============================================================================
-- 2.13 CATEGORIA: GEOGRAFIA (30 palavras)
-- ============================================================================

SELECT insert_word_with_categories('continente', 'Grande massa terrestre', ARRAY['geografia']);
SELECT insert_word_with_categories('país', 'Nação soberana', ARRAY['geografia']);
SELECT insert_word_with_categories('cidade', 'Centro urbano', ARRAY['geografia']);
SELECT insert_word_with_categories('capital', 'Cidade principal', ARRAY['geografia']);
SELECT insert_word_with_categories('aldeia', 'Povoação pequena', ARRAY['geografia']);
SELECT insert_word_with_categories('norte', 'Ponto cardeal', ARRAY['geografia']);
SELECT insert_word_with_categories('sul', 'Ponto cardeal oposto', ARRAY['geografia']);
SELECT insert_word_with_categories('este', 'Ponto cardeal oriental', ARRAY['geografia']);
SELECT insert_word_with_categories('oeste', 'Ponto cardeal ocidental', ARRAY['geografia']);
SELECT insert_word_with_categories('europa', 'Continente europeu', ARRAY['geografia']);
SELECT insert_word_with_categories('ásia', 'Maior continente', ARRAY['geografia']);
SELECT insert_word_with_categories('áfrica', 'Continente africano', ARRAY['geografia']);
SELECT insert_word_with_categories('américa', 'Novo continente', ARRAY['geografia']);
SELECT insert_word_with_categories('oceânia', 'Continente oceânico', ARRAY['geografia']);
SELECT insert_word_with_categories('portugal', 'País ibérico', ARRAY['geografia', 'portugal']);
SELECT insert_word_with_categories('lisboa', 'Capital de Portugal', ARRAY['geografia', 'portugal']);
SELECT insert_word_with_categories('porto', 'Segunda cidade portuguesa', ARRAY['geografia', 'portugal']);
SELECT insert_word_with_categories('equador', 'Linha imaginária', ARRAY['geografia']);
SELECT insert_word_with_categories('trópico', 'Linha de latitude', ARRAY['geografia']);
SELECT insert_word_with_categories('polo', 'Extremo da Terra', ARRAY['geografia']);
SELECT insert_word_with_categories('latitude', 'Coordenada horizontal', ARRAY['geografia']);
SELECT insert_word_with_categories('longitude', 'Coordenada vertical', ARRAY['geografia']);
SELECT insert_word_with_categories('costa', 'Beira-mar', ARRAY['geografia']);
SELECT insert_word_with_categories('baía', 'Enseada marinha', ARRAY['geografia']);
SELECT insert_word_with_categories('cabo', 'Ponta de terra no mar', ARRAY['geografia']);
SELECT insert_word_with_categories('golfo', 'Grande baía', ARRAY['geografia']);
SELECT insert_word_with_categories('estreito', 'Passagem marítima', ARRAY['geografia']);
SELECT insert_word_with_categories('península', 'Terra quase ilha', ARRAY['geografia']);
SELECT insert_word_with_categories('planalto', 'Terreno elevado plano', ARRAY['geografia']);
SELECT insert_word_with_categories('vale', 'Depressão entre montes', ARRAY['geografia']);

-- ============================================================================
-- 2.14 CATEGORIA: HISTÓRIA (25 palavras)
-- ============================================================================

SELECT insert_word_with_categories('guerra', 'Conflito armado', ARRAY['historia']);
SELECT insert_word_with_categories('paz', 'Ausência de conflito', ARRAY['historia']);
SELECT insert_word_with_categories('batalha', 'Combate militar', ARRAY['historia']);
SELECT insert_word_with_categories('rei', 'Monarca masculino', ARRAY['historia']);
SELECT insert_word_with_categories('rainha', 'Monarca feminina', ARRAY['historia']);
SELECT insert_word_with_categories('príncipe', 'Filho de rei', ARRAY['historia']);
SELECT insert_word_with_categories('imperador', 'Líder de império', ARRAY['historia']);
SELECT insert_word_with_categories('império', 'Grande reino', ARRAY['historia']);
SELECT insert_word_with_categories('república', 'Estado democrático', ARRAY['historia']);
SELECT insert_word_with_categories('revolução', 'Mudança radical', ARRAY['historia']);
SELECT insert_word_with_categories('tratado', 'Acordo entre nações', ARRAY['historia']);
SELECT insert_word_with_categories('descobrimento', 'Ato de descobrir', ARRAY['historia', 'portugal']);
SELECT insert_word_with_categories('conquista', 'Tomada de território', ARRAY['historia']);
SELECT insert_word_with_categories('colónia', 'Território dominado', ARRAY['historia']);
SELECT insert_word_with_categories('independência', 'Liberdade política', ARRAY['historia']);
SELECT insert_word_with_categories('século', 'Período de cem anos', ARRAY['historia', 'tempo']);
SELECT insert_word_with_categories('era', 'Época histórica', ARRAY['historia', 'tempo']);
SELECT insert_word_with_categories('dinastia', 'Família de governantes', ARRAY['historia']);
SELECT insert_word_with_categories('trono', 'Assento real', ARRAY['historia']);
SELECT insert_word_with_categories('coroa', 'Símbolo de realeza', ARRAY['historia']);
SELECT insert_word_with_categories('espada', 'Arma branca', ARRAY['historia']);
SELECT insert_word_with_categories('escudo', 'Defesa de batalha', ARRAY['historia']);
SELECT insert_word_with_categories('armadura', 'Proteção de guerreiro', ARRAY['historia']);
SELECT insert_word_with_categories('caravela', 'Navio dos descobrimentos', ARRAY['historia', 'portugal']);
SELECT insert_word_with_categories('navegador', 'Explorador marítimo', ARRAY['historia', 'portugal']);

-- ============================================================================
-- 2.15 CATEGORIA: EMOÇÕES (25 palavras)
-- ============================================================================

SELECT insert_word_with_categories('amor', 'Sentimento de afeto', ARRAY['emocoes']);
SELECT insert_word_with_categories('alegria', 'Sentimento de felicidade', ARRAY['emocoes']);
SELECT insert_word_with_categories('tristeza', 'Sentimento de pesar', ARRAY['emocoes']);
SELECT insert_word_with_categories('raiva', 'Sentimento de ira', ARRAY['emocoes']);
SELECT insert_word_with_categories('medo', 'Sentimento de receio', ARRAY['emocoes']);
SELECT insert_word_with_categories('surpresa', 'Sentimento de espanto', ARRAY['emocoes']);
SELECT insert_word_with_categories('nojo', 'Sentimento de repulsa', ARRAY['emocoes']);
SELECT insert_word_with_categories('vergonha', 'Sentimento de embaraço', ARRAY['emocoes']);
SELECT insert_word_with_categories('culpa', 'Sentimento de responsabilidade', ARRAY['emocoes']);
SELECT insert_word_with_categories('orgulho', 'Sentimento de valor', ARRAY['emocoes']);
SELECT insert_word_with_categories('inveja', 'Sentimento de cobiça', ARRAY['emocoes']);
SELECT insert_word_with_categories('ciúme', 'Sentimento de posse', ARRAY['emocoes']);
SELECT insert_word_with_categories('gratidão', 'Sentimento de agradecimento', ARRAY['emocoes']);
SELECT insert_word_with_categories('esperança', 'Sentimento de expectativa', ARRAY['emocoes']);
SELECT insert_word_with_categories('ansiedade', 'Sentimento de preocupação', ARRAY['emocoes']);
SELECT insert_word_with_categories('solidão', 'Sentimento de isolamento', ARRAY['emocoes']);
SELECT insert_word_with_categories('saudade', 'Sentimento de falta', ARRAY['emocoes', 'portugal']);
SELECT insert_word_with_categories('desejo', 'Sentimento de vontade', ARRAY['emocoes']);
SELECT insert_word_with_categories('paixão', 'Sentimento intenso', ARRAY['emocoes']);
SELECT insert_word_with_categories('compaixão', 'Sentimento de piedade', ARRAY['emocoes']);
SELECT insert_word_with_categories('admiração', 'Sentimento de respeito', ARRAY['emocoes']);
SELECT insert_word_with_categories('ódio', 'Sentimento de aversão', ARRAY['emocoes']);
SELECT insert_word_with_categories('felicidade', 'Estado de contentamento', ARRAY['emocoes']);
SELECT insert_word_with_categories('sofrimento', 'Estado de dor', ARRAY['emocoes']);
SELECT insert_word_with_categories('paz', 'Estado de tranquilidade', ARRAY['emocoes']);

-- ============================================================================
-- 2.16 CATEGORIA: TEMPO (20 palavras)
-- ============================================================================

SELECT insert_word_with_categories('hora', 'Unidade de tempo', ARRAY['tempo']);
SELECT insert_word_with_categories('minuto', 'Sexagésima de hora', ARRAY['tempo']);
SELECT insert_word_with_categories('segundo', 'Sexagésimo de minuto', ARRAY['tempo']);
SELECT insert_word_with_categories('dia', 'Período de vinte e quatro horas', ARRAY['tempo']);
SELECT insert_word_with_categories('semana', 'Período de sete dias', ARRAY['tempo']);
SELECT insert_word_with_categories('mês', 'Período aproximado de trinta dias', ARRAY['tempo']);
SELECT insert_word_with_categories('ano', 'Período de doze meses', ARRAY['tempo']);
SELECT insert_word_with_categories('manhã', 'Período matinal', ARRAY['tempo']);
SELECT insert_word_with_categories('tarde', 'Período vespertino', ARRAY['tempo']);
SELECT insert_word_with_categories('noite', 'Período noturno', ARRAY['tempo']);
SELECT insert_word_with_categories('aurora', 'Início da manhã', ARRAY['tempo']);
SELECT insert_word_with_categories('crepúsculo', 'Final da tarde', ARRAY['tempo']);
SELECT insert_word_with_categories('primavera', 'Estação das flores', ARRAY['tempo']);
SELECT insert_word_with_categories('verão', 'Estação quente', ARRAY['tempo']);
SELECT insert_word_with_categories('outono', 'Estação das colheitas', ARRAY['tempo']);
SELECT insert_word_with_categories('inverno', 'Estação fria', ARRAY['tempo']);
SELECT insert_word_with_categories('passado', 'Tempo que foi', ARRAY['tempo']);
SELECT insert_word_with_categories('presente', 'Tempo atual', ARRAY['tempo']);
SELECT insert_word_with_categories('futuro', 'Tempo que virá', ARRAY['tempo']);
SELECT insert_word_with_categories('relógio', 'Instrumento de medição', ARRAY['tempo']);

-- ============================================================================
-- 2.17 CATEGORIA: CORES (15 palavras)
-- ============================================================================

SELECT insert_word_with_categories('vermelho', 'Cor do sangue', ARRAY['cores']);
SELECT insert_word_with_categories('azul', 'Cor do céu', ARRAY['cores']);
SELECT insert_word_with_categories('verde', 'Cor da relva', ARRAY['cores']);
SELECT insert_word_with_categories('amarelo', 'Cor do sol', ARRAY['cores']);
SELECT insert_word_with_categories('roxo', 'Cor misturada', ARRAY['cores']);
SELECT insert_word_with_categories('rosa', 'Cor suave', ARRAY['cores']);
SELECT insert_word_with_categories('castanho', 'Cor da madeira', ARRAY['cores']);
SELECT insert_word_with_categories('preto', 'Ausência de luz', ARRAY['cores']);
SELECT insert_word_with_categories('branco', 'Soma de todas as cores', ARRAY['cores']);
SELECT insert_word_with_categories('cinzento', 'Cor intermédia', ARRAY['cores']);
SELECT insert_word_with_categories('dourado', 'Cor do ouro', ARRAY['cores']);
SELECT insert_word_with_categories('prateado', 'Cor da prata', ARRAY['cores']);
SELECT insert_word_with_categories('turquesa', 'Cor azul-esverdeada', ARRAY['cores']);
SELECT insert_word_with_categories('violeta', 'Cor roxa escura', ARRAY['cores']);
SELECT insert_word_with_categories('bege', 'Cor creme clara', ARRAY['cores']);

-- ============================================================================
-- 2.18 CATEGORIA: NÚMEROS (15 palavras)
-- ============================================================================

SELECT insert_word_with_categories('zero', 'Algarismo nulo', ARRAY['numeros']);
SELECT insert_word_with_categories('um', 'Primeiro número', ARRAY['numeros']);
SELECT insert_word_with_categories('dois', 'Número par primo', ARRAY['numeros']);
SELECT insert_word_with_categories('três', 'Número ímpar', ARRAY['numeros']);
SELECT insert_word_with_categories('quatro', 'Número de lados do quadrado', ARRAY['numeros']);
SELECT insert_word_with_categories('cinco', 'Dedos da mão', ARRAY['numeros']);
SELECT insert_word_with_categories('seis', 'Meia dúzia', ARRAY['numeros']);
SELECT insert_word_with_categories('sete', 'Dias da semana', ARRAY['numeros']);
SELECT insert_word_with_categories('oito', 'Número da sorte', ARRAY['numeros']);
SELECT insert_word_with_categories('nove', 'Anterior a dez', ARRAY['numeros']);
SELECT insert_word_with_categories('dez', 'Número de dedos', ARRAY['numeros']);
SELECT insert_word_with_categories('cem', 'Centena', ARRAY['numeros']);
SELECT insert_word_with_categories('mil', 'Milhar', ARRAY['numeros']);
SELECT insert_word_with_categories('milhão', 'Mil milhares', ARRAY['numeros']);
SELECT insert_word_with_categories('metade', 'Divisão por dois', ARRAY['numeros']);

-- ============================================================================
-- 2.19 CATEGORIA: PORTUGAL (30 palavras adicionais)
-- ============================================================================

SELECT insert_word_with_categories('azulejo', 'Cerâmica portuguesa decorativa', ARRAY['portugal', 'arte']);
SELECT insert_word_with_categories('pastel', 'Doce típico de nata', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('sardinha', 'Peixe típico de festivais', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('chouriço', 'Enchido tradicional', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('alheira', 'Enchido de aves', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('francesinha', 'Prato típico do Porto', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('caldo-verde', 'Sopa portuguesa', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('açorda', 'Sopa de pão', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('queijada', 'Doce de queijo', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('bolo-rei', 'Doce de Natal', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('galo', 'Símbolo de Barcelos', ARRAY['portugal']);
SELECT insert_word_with_categories('cortiça', 'Material natural português', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('sobreiro', 'Árvore da cortiça', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('mosteiro', 'Edifício religioso histórico', ARRAY['portugal', 'historia']);
SELECT insert_word_with_categories('azeitona', 'Fruto da oliveira', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('pinheiro', 'Árvore conífera', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('carvalho', 'Árvore de folha caduca', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('medronho', 'Aguardente de fruto', ARRAY['portugal']);
SELECT insert_word_with_categories('granel', 'Vinho a granel', ARRAY['portugal', 'comida']);
SELECT insert_word_with_categories('tapada', 'Área florestal vedada', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('quintal', 'Terreno junto à casa', ARRAY['portugal', 'casa']);
SELECT insert_word_with_categories('terreiro', 'Espaço aberto', ARRAY['portugal']);
SELECT insert_word_with_categories('adega', 'Local de vinho', ARRAY['portugal']);
SELECT insert_word_with_categories('oliveira', 'Árvore da azeitona', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('lavanda', 'Planta aromática', ARRAY['portugal', 'natureza']);
SELECT insert_word_with_categories('cravo', 'Símbolo da revolução', ARRAY['portugal', 'historia']);
SELECT insert_word_with_categories('bandeira', 'Símbolo nacional', ARRAY['portugal']);
SELECT insert_word_with_categories('hino', 'Canção nacional', ARRAY['portugal', 'musica']);
SELECT insert_word_with_categories('cavaquinho', 'Instrumento de cordas pequeno', ARRAY['portugal', 'musica']);
SELECT insert_word_with_categories('arraial', 'Festa popular', ARRAY['portugal']);

-- ============================================================================
-- 2.20 CATEGORIA: GERAL (30 palavras diversas)
-- ============================================================================

SELECT insert_word_with_categories('olá', 'Saudação comum', ARRAY['geral']);
SELECT insert_word_with_categories('adeus', 'Despedida', ARRAY['geral']);
SELECT insert_word_with_categories('sim', 'Afirmação', ARRAY['geral']);
SELECT insert_word_with_categories('não', 'Negação', ARRAY['geral']);
SELECT insert_word_with_categories('obrigado', 'Agradecimento', ARRAY['geral']);
SELECT insert_word_with_categories('desculpa', 'Pedido de perdão', ARRAY['geral']);
SELECT insert_word_with_categories('favor', 'Pedido gentil', ARRAY['geral']);
SELECT insert_word_with_categories('ajuda', 'Assistência', ARRAY['geral']);
SELECT insert_word_with_categories('amigo', 'Pessoa querida', ARRAY['geral']);
SELECT insert_word_with_categories('família', 'Grupo de parentes', ARRAY['geral']);
SELECT insert_word_with_categories('pai', 'Progenitor masculino', ARRAY['geral']);
SELECT insert_word_with_categories('mãe', 'Progenitora feminina', ARRAY['geral']);
SELECT insert_word_with_categories('filho', 'Descendente', ARRAY['geral']);
SELECT insert_word_with_categories('irmão', 'Filho dos mesmos pais', ARRAY['geral']);
SELECT insert_word_with_categories('avô', 'Pai do pai', ARRAY['geral']);
SELECT insert_word_with_categories('tio', 'Irmão dos pais', ARRAY['geral']);
SELECT insert_word_with_categories('primo', 'Filho do tio', ARRAY['geral']);
SELECT insert_word_with_categories('bebé', 'Criança recém-nascida', ARRAY['geral']);
SELECT insert_word_with_categories('criança', 'Ser humano jovem', ARRAY['geral']);
SELECT insert_word_with_categories('adulto', 'Pessoa crescida', ARRAY['geral']);
SELECT insert_word_with_categories('idoso', 'Pessoa de idade avançada', ARRAY['geral']);
SELECT insert_word_with_categories('homem', 'Ser humano masculino', ARRAY['geral']);
SELECT insert_word_with_categories('mulher', 'Ser humano feminino', ARRAY['geral']);
SELECT insert_word_with_categories('pessoa', 'Indivíduo humano', ARRAY['geral']);
SELECT insert_word_with_categories('gente', 'Conjunto de pessoas', ARRAY['geral']);
SELECT insert_word_with_categories('nome', 'Designação pessoal', ARRAY['geral']);
SELECT insert_word_with_categories('idade', 'Tempo de vida', ARRAY['geral']);
SELECT insert_word_with_categories('vida', 'Existência', ARRAY['geral']);
SELECT insert_word_with_categories('morte', 'Fim da vida', ARRAY['geral']);
SELECT insert_word_with_categories('mundo', 'Planeta Terra', ARRAY['geral']);

-- ============================================================================
-- 3. VERIFICAÇÃO E ESTATÍSTICAS
-- ============================================================================

DO $$
DECLARE
  v_total_words INTEGER;
  v_total_categories INTEGER;
  v_total_associations INTEGER;
BEGIN
  -- Contar palavras
  SELECT COUNT(*) INTO v_total_words FROM dictionary_pt;
  
  -- Contar categorias
  SELECT COUNT(*) INTO v_total_categories FROM word_categories;
  
  -- Contar associações
  SELECT COUNT(*) INTO v_total_associations FROM dictionary_categories;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ DADOS INICIAIS IMPORTADOS COM SUCESSO!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS:';
  RAISE NOTICE '  📝 Total de palavras: %', v_total_words;
  RAISE NOTICE '  🏷️  Total de categorias: %', v_total_categories;
  RAISE NOTICE '  🔗 Total de associações: %', v_total_associations;
  RAISE NOTICE '  📈 Média de palavras por categoria: %', ROUND(v_total_associations::NUMERIC / v_total_categories, 1);
  RAISE NOTICE '';
  RAISE NOTICE '🎮 PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Executar 003_cron_jobs.sql';
  RAISE NOTICE '  2. Deploy Edge Functions no Supabase';
  RAISE NOTICE '  3. Configurar Vault secrets';
  RAISE NOTICE '  4. Testar geradores de puzzles';
  RAISE NOTICE '';
END $$;

-- Remover função auxiliar
DROP FUNCTION IF EXISTS insert_word_with_categories(TEXT, TEXT, TEXT[]);
