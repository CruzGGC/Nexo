-- Exemplos de Puzzles para inserir na base de dados Supabase
-- Execute estes comandos no SQL Editor do Supabase

-- ============================================
-- PUZZLE 1: Simples (5x5)
-- ============================================

INSERT INTO puzzles (type, grid_data, clues, solutions, publish_date)
VALUES (
  'standard_pt',
  '{
    "grid": [
      [
        {"value": "", "correct": "C", "number": 1, "isBlack": false, "row": 0, "col": 0},
        {"value": "", "correct": "A", "isBlack": false, "row": 0, "col": 1},
        {"value": "", "correct": "S", "isBlack": false, "row": 0, "col": 2},
        {"value": "", "correct": "A", "isBlack": false, "row": 0, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 0, "col": 4}
      ],
      [
        {"value": "", "correct": "A", "isBlack": false, "row": 1, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 1},
        {"value": "", "correct": "O", "number": 2, "isBlack": false, "row": 1, "col": 2},
        {"value": "", "correct": "L", "isBlack": false, "row": 1, "col": 3},
        {"value": "", "correct": "A", "isBlack": false, "row": 1, "col": 4}
      ],
      [
        {"value": "", "correct": "F", "number": 3, "isBlack": false, "row": 2, "col": 0},
        {"value": "", "correct": "A", "isBlack": false, "row": 2, "col": 1},
        {"value": "", "correct": "D", "isBlack": false, "row": 2, "col": 2},
        {"value": "", "correct": "O", "isBlack": false, "row": 2, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 4}
      ],
      [
        {"value": "", "correct": "E", "isBlack": false, "row": 3, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 1},
        {"value": "", "correct": "A", "isBlack": false, "row": 3, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 4}
      ],
      [
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 1},
        {"value": "", "correct": "R", "isBlack": false, "row": 4, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 4}
      ]
    ]
  }'::jsonb,
  '{
    "across": [
      {
        "number": 1,
        "text": "Habitação, moradia",
        "answer": "CASA",
        "startRow": 0,
        "startCol": 0,
        "direction": "across"
      },
      {
        "number": 2,
        "text": "Saudação informal",
        "answer": "OLA",
        "startRow": 1,
        "startCol": 2,
        "direction": "across"
      },
      {
        "number": 3,
        "text": "Destino, género musical português",
        "answer": "FADO",
        "startRow": 2,
        "startCol": 0,
        "direction": "across"
      }
    ],
    "down": [
      {
        "number": 1,
        "text": "Bebida estimulante",
        "answer": "CAFE",
        "startRow": 0,
        "startCol": 0,
        "direction": "down"
      },
      {
        "number": 2,
        "text": "Nota musical + Lá + Ré",
        "answer": "SOLAR",
        "startRow": 0,
        "startCol": 2,
        "direction": "down"
      }
    ]
  }'::jsonb,
  '{
    "CASA": "Casa",
    "OLA": "Olá",
    "FADO": "Fado",
    "CAFE": "Café",
    "SOLAR": "Solar"
  }'::jsonb,
  NULL
);

-- ============================================
-- PUZZLE 2: Palavras Portuguesas (7x7)
-- ============================================

INSERT INTO puzzles (type, grid_data, clues, solutions, publish_date)
VALUES (
  'standard_pt',
  '{
    "grid": [
      [
        {"value": "", "correct": "P", "number": 1, "isBlack": false, "row": 0, "col": 0},
        {"value": "", "correct": "O", "isBlack": false, "row": 0, "col": 1},
        {"value": "", "correct": "R", "isBlack": false, "row": 0, "col": 2},
        {"value": "", "correct": "T", "isBlack": false, "row": 0, "col": 3},
        {"value": "", "correct": "O", "isBlack": false, "row": 0, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 0, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 0, "col": 6}
      ],
      [
        {"value": "", "correct": "R", "isBlack": false, "row": 1, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 1},
        {"value": "", "correct": "I", "isBlack": false, "row": 1, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 3},
        {"value": "", "correct": "V", "isBlack": false, "row": 1, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 6}
      ],
      [
        {"value": "", "correct": "A", "isBlack": false, "row": 2, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 1},
        {"value": "", "correct": "O", "isBlack": false, "row": 2, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 3},
        {"value": "", "correct": "O", "isBlack": false, "row": 2, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 6}
      ],
      [
        {"value": "", "correct": "I", "number": 2, "isBlack": false, "row": 3, "col": 0},
        {"value": "", "correct": "R", "isBlack": false, "row": 3, "col": 1},
        {"value": "", "correct": "M", "isBlack": false, "row": 3, "col": 2},
        {"value": "", "correct": "A", "isBlack": false, "row": 3, "col": 3},
        {"value": "", "correct": "O", "isBlack": false, "row": 3, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 6}
      ],
      [
        {"value": "", "correct": "A", "isBlack": false, "row": 4, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 1},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 4, "col": 6}
      ],
      [
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 1},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 5, "col": 6}
      ],
      [
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 1},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 5},
        {"value": "", "correct": "", "isBlack": true, "row": 6, "col": 6}
      ]
    ]
  }'::jsonb,
  '{
    "across": [
      {
        "number": 1,
        "text": "Cidade e país europeu",
        "answer": "PORTO",
        "startRow": 0,
        "startCol": 0,
        "direction": "across"
      },
      {
        "number": 2,
        "text": "Irmã ou irmão",
        "answer": "IRMAO",
        "startRow": 3,
        "startCol": 0,
        "direction": "across"
      }
    ],
    "down": [
      {
        "number": 1,
        "text": "Local público para recreio",
        "answer": "PRAIA",
        "startRow": 0,
        "startCol": 0,
        "direction": "down"
      },
      {
        "number": 3,
        "text": "Corrente de água",
        "answer": "RIO",
        "startRow": 0,
        "startCol": 2,
        "direction": "down"
      },
      {
        "number": 4,
        "text": "Ato ou acção",
        "answer": "VOVO",
        "startRow": 1,
        "startCol": 4,
        "direction": "down"
      }
    ]
  }'::jsonb,
  '{
    "PORTO": "Porto",
    "IRMAO": "Irmão",
    "PRAIA": "Praia",
    "RIO": "Rio",
    "VOVO": "Vovó"
  }'::jsonb,
  NULL
);

-- ============================================
-- PUZZLE DIÁRIO DE HOJE
-- ============================================

INSERT INTO puzzles (type, grid_data, clues, solutions, publish_date)
VALUES (
  'daily',
  '{
    "grid": [
      [
        {"value": "", "correct": "L", "number": 1, "isBlack": false, "row": 0, "col": 0},
        {"value": "", "correct": "I", "isBlack": false, "row": 0, "col": 1},
        {"value": "", "correct": "S", "isBlack": false, "row": 0, "col": 2},
        {"value": "", "correct": "B", "isBlack": false, "row": 0, "col": 3},
        {"value": "", "correct": "O", "isBlack": false, "row": 0, "col": 4},
        {"value": "", "correct": "A", "isBlack": false, "row": 0, "col": 5}
      ],
      [
        {"value": "", "correct": "U", "isBlack": false, "row": 1, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 1},
        {"value": "", "correct": "O", "isBlack": false, "row": 1, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 3},
        {"value": "", "correct": "C", "isBlack": false, "row": 1, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 1, "col": 5}
      ],
      [
        {"value": "", "correct": "A", "number": 2, "isBlack": false, "row": 2, "col": 0},
        {"value": "", "correct": "Z", "isBlack": false, "row": 2, "col": 1},
        {"value": "", "correct": "U", "isBlack": false, "row": 2, "col": 2},
        {"value": "", "correct": "L", "isBlack": false, "row": 2, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 2, "col": 5}
      ],
      [
        {"value": "", "correct": "R", "isBlack": false, "row": 3, "col": 0},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 1},
        {"value": "", "correct": "L", "isBlack": false, "row": 3, "col": 2},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 3},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 4},
        {"value": "", "correct": "", "isBlack": true, "row": 3, "col": 5}
      ]
    ]
  }'::jsonb,
  '{
    "across": [
      {
        "number": 1,
        "text": "Capital de Portugal",
        "answer": "LISBOA",
        "startRow": 0,
        "startCol": 0,
        "direction": "across"
      },
      {
        "number": 2,
        "text": "Cor do céu",
        "answer": "AZUL",
        "startRow": 2,
        "startCol": 0,
        "direction": "across"
      }
    ],
    "down": [
      {
        "number": 1,
        "text": "Satélite natural da Terra",
        "answer": "LUAR",
        "startRow": 0,
        "startCol": 0,
        "direction": "down"
      },
      {
        "number": 3,
        "text": "Contrário de Leste",
        "answer": "SOL",
        "startRow": 0,
        "startCol": 2,
        "direction": "down"
      },
      {
        "number": 4,
        "text": "Astro que ilumina o dia",
        "answer": "OC",
        "startRow": 0,
        "startCol": 4,
        "direction": "down"
      }
    ]
  }'::jsonb,
  '{
    "LISBOA": "Lisboa",
    "AZUL": "Azul",
    "LUAR": "Luar",
    "SOL": "Sol",
    "OC": "Oc"
  }'::jsonb,
  CURRENT_DATE
);

-- ============================================
-- Verificar os puzzles inseridos
-- ============================================

SELECT id, type, publish_date, created_at
FROM puzzles
ORDER BY created_at DESC;
