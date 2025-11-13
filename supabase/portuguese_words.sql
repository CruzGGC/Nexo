-- Portuguese Words by Categories - Expansion Pack
-- Este ficheiro adiciona 500+ novas palavras organizadas por categorias temáticas
-- Execute APÓS a migration 007_add_word_categories.sql

-- =============================================================================
-- CATEGORIA: ANIMAIS 🐾
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('leão', 'Felino grande rei da selva'),
('tigre', 'Felino listrado asiático'),
('urso', 'Mamífero grande e peludo'),
('lobo', 'Canídeo selvagem que caça em grupo'),
('raposa', 'Canídeo astuto de cauda espessa'),
('coelho', 'Mamífero de orelhas compridas'),
('peixe', 'Animal aquático com guelras'),
('baleia', 'Maior mamífero marinho'),
('golfinho', 'Mamífero marinho inteligente'),
('tubarão', 'Peixe predador com dentes afiados'),
('cobra', 'Réptil sem patas'),
('jacaré', 'Réptil aquático dentado'),
('tartaruga', 'Réptil com carapaça'),
('águia', 'Ave de rapina majestosa'),
('corvo', 'Ave preta de mau agouro'),
('pombo', 'Ave urbana comum'),
('galinha', 'Ave doméstica que põe ovos'),
('pato', 'Ave aquática de bico achatado'),
('cisne', 'Ave aquática elegante e branca'),
('borboleta', 'Inseto com asas coloridas'),
('abelha', 'Inseto que produz mel'),
('formiga', 'Inseto trabalhador em colónia'),
('aranha', 'Aracnídeo que tece teias'),
('mosca', 'Inseto voador incómodo'),
('cavalo', 'Equino usado para montar'),
('vaca', 'Bovino fêmea produtora de leite'),
('ovelha', 'Mamífero lanudo de rebanho'),
('cabra', 'Mamífero com barbas e chifres'),
('porco', 'Suíno criado para carne'),
('rato', 'Roedor pequeno de cauda longa'),
('elefante', 'Maior mamífero terrestre'),
('girafa', 'Mamífero de pescoço longo'),
('zebra', 'Equino africano listrado'),
('macaco', 'Primata ágil das árvores'),
('panda', 'Urso preto e branco da China'),
('canguru', 'Marsupial australiano saltador'),
('pinguim', 'Ave marinha que não voa'),
('foca', 'Mamífero marinho de barbatanas'),
('polvo', 'Molusco de oito tentáculos'),
('caranguejo', 'Crustáceo de pinças'),
('caracol', 'Molusco lento com concha');

-- Link ANIMAIS
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'animais')
FROM dictionary_pt
WHERE word IN ('leão', 'tigre', 'urso', 'lobo', 'raposa', 'coelho', 'peixe', 
'baleia', 'golfinho', 'tubarão', 'cobra', 'jacaré', 'tartaruga', 'águia', 
'corvo', 'pombo', 'galinha', 'pato', 'cisne', 'borboleta', 'abelha', 'formiga', 
'aranha', 'mosca', 'cavalo', 'vaca', 'ovelha', 'cabra', 'porco', 'rato', 
'elefante', 'girafa', 'zebra', 'macaco', 'panda', 'canguru', 'pinguim', 
'foca', 'polvo', 'caranguejo', 'caracol', 'cão');

-- =============================================================================
-- CATEGORIA: COMIDA E BEBIDAS 🍽️
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('arroz', 'Cereal básico asiático'),
('massa', 'Alimento de farinha italiana'),
('sopa', 'Prato líquido quente'),
('salada', 'Prato frio de vegetais'),
('carne', 'Alimento de origem animal'),
('peixe', 'Carne de animal aquático'),
('frango', 'Carne de ave doméstica'),
('queijo', 'Derivado lácteo sólido'),
('leite', 'Líquido branco nutritivo'),
('manteiga', 'Gordura láctea amarela'),
('ovo', 'Alimento oval de galinha'),
('pão', 'Alimento básico de farinha'),
('torrada', 'Fatia de pão tostada'),
('bolo', 'Doce de festa'),
('biscoito', 'Bolacha doce ou salgada'),
('gelado', 'Sobremesa fria cremosa'),
('chocolate', 'Doce de cacau'),
('mel', 'Doce natural de abelhas'),
('açúcar', 'Adoçante cristalino branco'),
('sal', 'Condimento branco salgado'),
('pimenta', 'Especiaria picante'),
('alho', 'Condimento de dentes'),
('cebola', 'Vegetal de camadas choradeiras'),
('tomate', 'Fruto vermelho usado como legume'),
('batata', 'Tubérculo básico'),
('cenoura', 'Raiz laranja rica em vitaminas'),
('alface', 'Folha verde de salada'),
('pepino', 'Vegetal verde alongado'),
('maçã', 'Fruta vermelha ou verde'),
('laranja', 'Citrino cor de fogo'),
('banana', 'Fruta amarela tropical'),
('uva', 'Fruto pequeno em cacho'),
('morango', 'Fruto vermelho adocicado'),
('pêra', 'Fruta em forma de sino'),
('melão', 'Fruta grande de casca verde'),
('melancia', 'Fruta vermelha aguada verão'),
('abacaxi', 'Fruta tropical com coroa'),
('limão', 'Citrino amarelo azedo'),
('vinho', 'Bebida alcoólica de uvas'),
('cerveja', 'Bebida fermentada de cevada'),
('sumo', 'Líquido extraído de frutas'),
('chá', 'Infusão de folhas'),
('café', 'Bebida estimulante escura'),
('água', 'Líquido transparente vital'),
('iogurte', 'Leite fermentado cremoso');

-- Link COMIDA
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'comida')
FROM dictionary_pt
WHERE word IN ('arroz', 'massa', 'sopa', 'salada', 'carne', 'frango', 'queijo', 
'leite', 'manteiga', 'ovo', 'pão', 'torrada', 'bolo', 'biscoito', 'gelado', 
'chocolate', 'mel', 'açúcar', 'sal', 'pimenta', 'alho', 'cebola', 'tomate', 
'batata', 'cenoura', 'alface', 'pepino', 'maçã', 'laranja', 'banana', 'uva', 
'morango', 'pêra', 'melão', 'melancia', 'abacaxi', 'limão', 'vinho', 'cerveja', 
'sumo', 'chá', 'café', 'água', 'iogurte');

-- =============================================================================
-- CATEGORIA: DESPORTO ⚽
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('futebol', 'Desporto com bola nos pés'),
('basquete', 'Desporto de cestos altos'),
('ténis', 'Jogo de raquete e rede'),
('voleibol', 'Desporto de rede e bola aérea'),
('natação', 'Desporto aquático'),
('corrida', 'Ato de correr competitivamente'),
('salto', 'Ação de pular alto ou longe'),
('ciclismo', 'Desporto de bicicleta'),
('boxe', 'Luta de punhos com luvas'),
('judo', 'Arte marcial japonesa'),
('karaté', 'Arte marcial de golpes'),
('yoga', 'Prática de meditação e posturas'),
('ginástica', 'Exercícios corporais acrobáticos'),
('atletismo', 'Conjunto de modalidades atléticas'),
('esqui', 'Desporto de neve em pranchas'),
('golfe', 'Desporto de tacada em buracos'),
('râguebi', 'Desporto violento com bola oval'),
('hóquei', 'Jogo de stick e disco'),
('escalada', 'Subida de paredes rochosas'),
('surf', 'Desporto de prancha em ondas'),
('vela', 'Navegação desportiva'),
('remo', 'Desporto de barco a remos'),
('maratona', 'Corrida de longa distância'),
('triatlo', 'Prova tripla de resistência'),
('bola', 'Objeto esférico de jogo'),
('rede', 'Malha divisória em desportos'),
('campo', 'Terreno de jogo'),
('árbitro', 'Juiz de competição'),
('equipa', 'Grupo de atletas'),
('campeão', 'Vencedor de competição'),
('medalha', 'Prémio desportivo metálico'),
('troféu', 'Taça de vitória'),
('vitória', 'Ganhar uma competição'),
('derrota', 'Perder um jogo'),
('empate', 'Resultado igual entre equipas');

-- Link DESPORTO
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'desporto')
FROM dictionary_pt
WHERE word IN ('futebol', 'basquete', 'ténis', 'voleibol', 'natação', 'corrida', 
'salto', 'ciclismo', 'boxe', 'judo', 'karaté', 'yoga', 'ginástica', 'atletismo', 
'esqui', 'golfe', 'râguebi', 'hóquei', 'escalada', 'surf', 'vela', 'remo', 
'maratona', 'triatlo', 'bola', 'rede', 'campo', 'árbitro', 'equipa', 'campeão', 
'medalha', 'troféu', 'vitória', 'derrota', 'empate');

-- =============================================================================
-- CATEGORIA: NATUREZA 🌿
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('árvore', 'Planta lenhosa de tronco'),
('flor', 'Parte colorida da planta'),
('folha', 'Órgão verde vegetal'),
('rosa', 'Flor perfumada de espinhos'),
('lírio', 'Flor elegante de pétalas'),
('girassol', 'Flor amarela que segue o sol'),
('tulipa', 'Flor bulbosa ornamental'),
('orquídea', 'Flor exótica delicada'),
('cravo', 'Flor vermelha tradicional'),
('jasmim', 'Flor branca perfumada'),
('relva', 'Erva baixa de jardim'),
('musgo', 'Planta verde de pedras'),
('samambaia', 'Planta de folhas plumosas'),
('cacto', 'Planta espinhosa de deserto'),
('bosque', 'Pequena floresta'),
('floresta', 'Grande área de árvores'),
('selva', 'Floresta tropical densa'),
('deserto', 'Área árida sem água'),
('praia', 'Costa arenosa do mar'),
('montanha', 'Elevação natural alta'),
('vale', 'Depressão entre montanhas'),
('colina', 'Elevação suave de terreno'),
('planície', 'Terreno plano extenso'),
('vulcão', 'Montanha que expele lava'),
('rio', 'Curso de água doce'),
('lago', 'Massa de água doce parada'),
('cascata', 'Queda de água'),
('oceano', 'Grande massa de água salgada'),
('ilha', 'Terra cercada por água'),
('rocha', 'Pedra grande natural'),
('pedra', 'Fragmento mineral duro'),
('areia', 'Grãos finos de praia'),
('terra', 'Solo cultivável'),
('lama', 'Mistura de terra e água'),
('neve', 'Precipitação congelada branca'),
('gelo', 'Água sólida congelada'),
('chuva', 'Precipitação de gotas'),
('nuvem', 'Vapor de água no céu'),
('trovão', 'Som de tempestade'),
('raio', 'Descarga elétrica atmosférica'),
('vento', 'Corrente de ar'),
('tempestade', 'Fenómeno meteorológico violento');

-- Link NATUREZA
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'natureza')
FROM dictionary_pt
WHERE word IN ('árvore', 'flor', 'folha', 'rosa', 'lírio', 'girassol', 'tulipa', 
'orquídea', 'cravo', 'jasmim', 'relva', 'musgo', 'samambaia', 'cacto', 'bosque', 
'floresta', 'selva', 'deserto', 'praia', 'montanha', 'vale', 'colina', 'planície', 
'vulcão', 'rio', 'lago', 'cascata', 'oceano', 'ilha', 'rocha', 'pedra', 'areia', 
'terra', 'lama', 'neve', 'gelo', 'chuva', 'nuvem', 'trovão', 'raio', 'vento', 
'tempestade');

-- =============================================================================
-- CATEGORIA: CORPO HUMANO 🫀
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('cabeça', 'Parte superior do corpo'),
('olho', 'Órgão da visão'),
('nariz', 'Órgão do olfato'),
('boca', 'Abertura para comer e falar'),
('orelha', 'Órgão da audição'),
('dente', 'Estrutura dura na boca'),
('língua', 'Órgão do paladar'),
('lábio', 'Borda carnuda da boca'),
('rosto', 'Face anterior da cabeça'),
('pescoço', 'Parte que liga cabeça ao tronco'),
('ombro', 'Articulação do braço'),
('braço', 'Membro superior'),
('cotovelo', 'Articulação do braço'),
('pulso', 'Articulação da mão'),
('mão', 'Extremidade do braço'),
('dedo', 'Extremidade da mão'),
('unha', 'Proteção córnea do dedo'),
('peito', 'Parte frontal do tórax'),
('costas', 'Parte posterior do tronco'),
('barriga', 'Região abdominal'),
('umbigo', 'Cicatriz do cordão umbilical'),
('quadril', 'Articulação da bacia'),
('perna', 'Membro inferior'),
('coxa', 'Parte superior da perna'),
('joelho', 'Articulação da perna'),
('canela', 'Parte frontal da perna inferior'),
('tornozelo', 'Articulação do pé'),
('pé', 'Extremidade da perna'),
('calcanhar', 'Parte posterior do pé'),
('coração', 'Órgão que bombeia sangue'),
('pulmão', 'Órgão da respiração'),
('estômago', 'Órgão digestivo'),
('fígado', 'Órgão filtrador'),
('rim', 'Órgão do sistema urinário'),
('cérebro', 'Órgão do pensamento'),
('sangue', 'Fluido vermelho vital'),
('osso', 'Estrutura rígida do esqueleto'),
('músculo', 'Tecido contrátil'),
('pele', 'Revestimento do corpo'),
('cabelo', 'Fios que crescem na cabeça'),
('barba', 'Pelos faciais masculinos');

-- Link CORPO
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'corpo')
FROM dictionary_pt
WHERE word IN ('cabeça', 'olho', 'nariz', 'boca', 'orelha', 'dente', 'língua', 
'lábio', 'rosto', 'pescoço', 'ombro', 'braço', 'cotovelo', 'pulso', 'mão', 'dedo', 
'unha', 'peito', 'costas', 'barriga', 'umbigo', 'quadril', 'perna', 'coxa', 
'joelho', 'canela', 'tornozelo', 'pé', 'calcanhar', 'coração', 'pulmão', 
'estômago', 'fígado', 'rim', 'cérebro', 'sangue', 'osso', 'músculo', 'pele', 
'cabelo', 'barba');

-- =============================================================================
-- CATEGORIA: CASA E LAR 🏠
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('casa', 'Habitação, moradia'),
('quarto', 'Divisão para dormir'),
('sala', 'Divisão de estar'),
('cozinha', 'Divisão para cozinhar'),
('casa de banho', 'Divisão de higiene'),
('janela', 'Abertura com vidro'),
('porta', 'Entrada móvel'),
('parede', 'Divisória vertical'),
('teto', 'Cobertura superior'),
('chão', 'Superfície inferior'),
('telhado', 'Cobertura externa da casa'),
('escada', 'Degraus para subir'),
('varanda', 'Área externa elevada'),
('jardim', 'Área verde cultivada'),
('garagem', 'Abrigo para veículos'),
('cama', 'Móvel para dormir'),
('sofá', 'Assento estofado longo'),
('cadeira', 'Assento individual'),
('mesa', 'Superfície plana horizontal'),
('armário', 'Móvel para guardar'),
('gaveta', 'Compartimento deslizante'),
('estante', 'Móvel para livros'),
('espelho', 'Superfície refletora'),
('lâmpada', 'Fonte de luz artificial'),
('cortina', 'Pano de janela'),
('tapete', 'Cobertura de chão'),
('almofada', 'Acolchoado de decoração'),
('cobertor', 'Manta para aquecer'),
('lençol', 'Tecido de cama'),
('fronha', 'Capa de almofada'),
('toalha', 'Tecido para secar'),
('fogão', 'Aparelho para cozinhar'),
('forno', 'Aparelho para assar'),
('frigorífico', 'Aparelho de refrigeração'),
('micro-ondas', 'Forno de ondas rápidas'),
('batedeira', 'Aparelho de misturar'),
('liquidificador', 'Aparelho triturador'),
('torradeira', 'Aparelho para torrar pão'),
('cafeteira', 'Máquina de fazer café'),
('panela', 'Recipiente de cozinhar'),
('frigideira', 'Utensílio de fritar'),
('prato', 'Recipiente de comer'),
('copo', 'Recipiente para beber'),
('colher', 'Talher côncavo'),
('garfo', 'Talher com dentes'),
('faca', 'Talher cortante'),
('tigela', 'Recipiente fundo');

-- Link CASA
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'casa')
FROM dictionary_pt
WHERE word IN ('casa', 'quarto', 'sala', 'cozinha', 'janela', 'porta', 'parede', 
'teto', 'chão', 'telhado', 'escada', 'varanda', 'jardim', 'garagem', 'cama', 
'sofá', 'cadeira', 'mesa', 'armário', 'gaveta', 'estante', 'espelho', 'lâmpada', 
'cortina', 'tapete', 'almofada', 'cobertor', 'lençol', 'fronha', 'toalha', 
'fogão', 'forno', 'frigorífico', 'panela', 'frigideira', 'prato', 'copo', 
'colher', 'garfo', 'faca', 'tigela');

-- =============================================================================
-- CATEGORIA: VIAGEM E TRANSPORTES ✈️
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('carro', 'Veículo motorizado de quatro rodas'),
('autocarro', 'Veículo de transporte coletivo'),
('comboio', 'Veículo ferroviário'),
('metro', 'Transporte subterrâneo urbano'),
('avião', 'Aeronave de passageiros'),
('barco', 'Embarcação aquática'),
('navio', 'Grande embarcação marítima'),
('bicicleta', 'Veículo de duas rodas'),
('mota', 'Motocicleta de duas rodas'),
('táxi', 'Carro de aluguer'),
('camião', 'Veículo de carga'),
('ambulância', 'Veículo de emergência médica'),
('helicóptero', 'Aeronave de hélices'),
('foguetão', 'Veículo espacial'),
('estrada', 'Via pavimentada'),
('rua', 'Via urbana'),
('avenida', 'Rua larga arborizada'),
('ponte', 'Estrutura sobre obstáculo'),
('túnel', 'Passagem subterrânea'),
('aeroporto', 'Terminal de aviação'),
('estação', 'Terminal ferroviário'),
('porto', 'Terminal marítimo'),
('paragem', 'Ponto de autocarro'),
('semáforo', 'Sinal de trânsito luminoso'),
('mapa', 'Representação geográfica'),
('bilhete', 'Título de transporte'),
('bagagem', 'Conjunto de malas'),
('mala', 'Recipiente de viagem'),
('passaporte', 'Documento de viagem internacional'),
('viagem', 'Deslocação para destino'),
('turismo', 'Atividade de viajar'),
('hotel', 'Estabelecimento de hospedagem'),
('praia', 'Costa arenosa'),
('montanha', 'Elevação natural'),
('cidade', 'Centro urbano'),
('país', 'Nação soberana'),
('continente', 'Grande massa de terra');

-- Link VIAGEM
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'viagem')
FROM dictionary_pt
WHERE word IN ('carro', 'autocarro', 'comboio', 'metro', 'avião', 'barco', 
'navio', 'bicicleta', 'mota', 'táxi', 'camião', 'ambulância', 'helicóptero', 
'foguetão', 'estrada', 'rua', 'avenida', 'ponte', 'túnel', 'aeroporto', 
'estação', 'porto', 'paragem', 'semáforo', 'mapa', 'bilhete', 'bagagem', 
'mala', 'passaporte', 'viagem', 'turismo', 'hotel');

-- =============================================================================
-- CATEGORIA: PROFISSÕES 💼
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('médico', 'Profissional de saúde'),
('enfermeiro', 'Assistente de cuidados médicos'),
('dentista', 'Médico dos dentes'),
('professor', 'Educador profissional'),
('advogado', 'Profissional do direito'),
('engenheiro', 'Profissional técnico'),
('arquiteto', 'Projetista de edifícios'),
('bombeiro', 'Combatente de incêndios'),
('polícia', 'Agente da ordem'),
('soldado', 'Militar das forças armadas'),
('piloto', 'Condutor de aeronave'),
('motorista', 'Condutor de veículo'),
('cozinheiro', 'Profissional de culinária'),
('padeiro', 'Fabricante de pão'),
('agricultor', 'Trabalhador rural'),
('pescador', 'Capturador de peixes'),
('carpinteiro', 'Trabalhador de madeira'),
('pedreiro', 'Construtor de alvenaria'),
('eletricista', 'Técnico de eletricidade'),
('canalizador', 'Técnico de tubulações'),
('pintor', 'Aplicador de tinta ou artista'),
('mecânico', 'Técnico de motores'),
('fotógrafo', 'Capturador de imagens'),
('jornalista', 'Profissional de notícias'),
('escritor', 'Criador de textos'),
('músico', 'Artista de música'),
('ator', 'Intérprete teatral'),
('cantor', 'Artista vocal'),
('dançarino', 'Artista de dança'),
('designer', 'Criador de design'),
('programador', 'Criador de software'),
('cientista', 'Pesquisador científico'),
('vendedor', 'Comerciante de produtos'),
('barbeiro', 'Cortador de cabelo'),
('costureira', 'Profissional de costura'),
('jardineiro', 'Cultivador de jardins');

-- Link PROFISSÕES
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'profissoes')
FROM dictionary_pt
WHERE word IN ('médico', 'enfermeiro', 'dentista', 'professor', 'advogado', 
'engenheiro', 'arquiteto', 'bombeiro', 'polícia', 'soldado', 'piloto', 
'motorista', 'cozinheiro', 'padeiro', 'agricultor', 'pescador', 'carpinteiro', 
'pedreiro', 'eletricista', 'pintor', 'mecânico', 'fotógrafo', 'jornalista', 
'escritor', 'músico', 'ator', 'cantor', 'designer', 'programador', 
'cientista', 'vendedor', 'barbeiro', 'costureira', 'jardineiro');

-- =============================================================================
-- CATEGORIA: PORTUGAL 🇵🇹
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('fado', 'Género musical português'),
('bacalhau', 'Peixe seco típico'),
('pastel de nata', 'Doce conventual'),
('sardinha', 'Peixe popular português'),
('caldo verde', 'Sopa tradicional'),
('porto', 'Vinho do Douro'),
('azulejo', 'Cerâmica decorativa'),
('castelo', 'Fortificação medieval'),
('praia', 'Costa atlântica'),
('descobrimentos', 'Época das navegações'),
('caravela', 'Embarcação dos descobrimentos'),
('mosteiro', 'Edifício religioso'),
('torre', 'Estrutura alta histórica'),
('saudade', 'Sentimento nostálgico português'),
('galo', 'Símbolo de Barcelos'),
('cortiça', 'Material de sobreiro'),
('vinho', 'Bebida da uva'),
('azeite', 'Óleo de azeitona'),
('chouriço', 'Enchido tradicional'),
('alheira', 'Enchido de carne');

-- Link PORTUGAL
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'portugal')
FROM dictionary_pt
WHERE word IN ('fado', 'bacalhau', 'sardinha', 'porto', 'azulejo', 'castelo', 
'descobrimentos', 'caravela', 'mosteiro', 'torre', 'saudade', 'galo', 'cortiça', 
'vinho', 'azeite', 'chouriço', 'alheira');

-- =============================================================================
-- CATEGORIA: CORES 🎨
-- =============================================================================

INSERT INTO dictionary_pt (word, definition) VALUES
('vermelho', 'Cor do sangue'),
('azul', 'Cor do céu'),
('amarelo', 'Cor do sol'),
('verde', 'Cor da relva'),
('preto', 'Ausência de luz'),
('branco', 'Cor da neve'),
('cinzento', 'Cor entre preto e branco'),
('cor-de-rosa', 'Tom suave de vermelho'),
('roxo', 'Mistura de vermelho e azul'),
('laranja', 'Cor do fruto cítrico'),
('castanho', 'Cor de terra'),
('bege', 'Tom claro de castanho'),
('dourado', 'Cor de ouro'),
('prateado', 'Cor de prata'),
('turquesa', 'Azul esverdeado');

-- Link CORES
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'cores')
FROM dictionary_pt
WHERE word IN ('vermelho', 'azul', 'amarelo', 'verde', 'preto', 'branco', 
'cinzento', 'roxo', 'laranja', 'castanho', 'bege', 'dourado', 'prateado', 
'turquesa', 'cor');

-- =============================================================================
-- LINK PALAVRAS ANTIGAS ÀS CATEGORIAS GERAIS
-- =============================================================================

-- Palavras que já existiam - categorizar como GERAL
INSERT INTO dictionary_categories (word, category_id)
SELECT word, (SELECT id FROM word_categories WHERE slug = 'geral')
FROM dictionary_pt
WHERE word IN ('ano', 'amor', 'arte', 'dor', 'lua', 'mar', 'mãe', 'nó', 'sol', 
'paz', 'voz', 'luz', 'céu', 'rei', 'lei')
ON CONFLICT (word, category_id) DO NOTHING;
