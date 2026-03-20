import type { RoteiroStep } from "./store";

export interface ModeloEncontro {
  id: string;
  tema: string;
  categoria: string;
  leituraBiblica: string;
  materialApoio: string;
  roteiro: Omit<RoteiroStep, "id">[];
}

function step(tipo: RoteiroStep["tipo"], label: string, conteudo: string, tempo: number, oracaoTipo?: RoteiroStep["oracaoTipo"]): Omit<RoteiroStep, "id"> {
  return { tipo, label, conteudo, tempo, catequista: "", oracaoTipo };
}

export const CATEGORIAS_MODELOS = [
  "Jesus Cristo",
  "Santíssima Trindade",
  "Maria",
  "Dogmas Marianos",
  "Tempo Litúrgico",
  "História da Igreja",
  "Bíblia",
  "Novíssimos",
  "Missão",
  "Parábolas",
  "Vida de Jesus",
  "Cartas de Paulo",
  "Antigo Testamento",
  "Sacramentos",
  "Moral e Ética",
  "Oração",
];

export const MODELOS_ENCONTROS: ModeloEncontro[] = [
  // Jesus Cristo
  {
    id: "m1", tema: "Quem é Jesus Cristo?", categoria: "Jesus Cristo",
    leituraBiblica: "Jo 14,6 - Eu sou o caminho, a verdade e a vida",
    materialApoio: "Catecismo da Igreja Católica §422-451",
    roteiro: [
      step("acolhida", "Acolhida", "Receber os catequizandos com música de acolhida. Perguntar: quem é Jesus para você?", 10),
      step("oracao_inicial", "Oração Inicial", "Oração Simples pedindo a presença do Espírito Santo", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Apresentar Jesus como Deus verdadeiro e homem verdadeiro. Usar imagens e passagens bíblicas sobre seus milagres e ensinamentos.", 20),
      step("dinamica", "Dinâmica", "Cada catequizando escreve uma carta para Jesus expressando o que sente por Ele.", 15),
      step("compromisso", "Compromisso", "Ler um trecho do Evangelho todos os dias desta semana.", 5),
      step("avisos", "Avisos", "Informes gerais da comunidade.", 3),
      step("oracao_final", "Oração Final", "Pai Nosso e Ave Maria em conjunto.", 5),
    ],
  },
  {
    id: "m2", tema: "Jesus, o Bom Pastor", categoria: "Jesus Cristo",
    leituraBiblica: "Jo 10,11-18 - Eu sou o Bom Pastor",
    materialApoio: "Documento de Aparecida §243-245",
    roteiro: [
      step("acolhida", "Acolhida", "Acolher com carinho. Perguntar o que sabem sobre um pastor de ovelhas.", 8),
      step("oracao_inicial", "Oração Inicial", "Salmo 23 - O Senhor é meu pastor", 5, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Explicar a parábola do Bom Pastor e como Jesus cuida de cada um de nós.", 20),
      step("dinamica", "Dinâmica", "Desenhar uma ovelha e escrever nela algo que precisam que Jesus cuide.", 15),
      step("compromisso", "Compromisso", "Ser 'bom pastor' para alguém esta semana: ajudar, cuidar, acolher.", 5),
      step("avisos", "Avisos", "Informes da catequese.", 3),
      step("oracao_final", "Oração Final", "Oração espontânea de agradecimento.", 5),
    ],
  },
  // Santíssima Trindade
  {
    id: "m3", tema: "O Mistério da Santíssima Trindade", categoria: "Santíssima Trindade",
    leituraBiblica: "Mt 28,19 - Batizai em nome do Pai, do Filho e do Espírito Santo",
    materialApoio: "CIC §232-267",
    roteiro: [
      step("acolhida", "Acolhida", "Iniciar fazendo o sinal da cruz pausadamente e refletir sobre cada pessoa da Trindade.", 8),
      step("oracao_inicial", "Oração Inicial", "Glória ao Pai e louvor à Trindade", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Explicar que Deus é um só em três pessoas: Pai (criador), Filho (redentor), Espírito Santo (santificador). Usar analogias.", 25),
      step("dinamica", "Dinâmica", "Trevo de 3 folhas: cada folha representa uma pessoa da Trindade. Montar com papel.", 15),
      step("compromisso", "Compromisso", "Fazer o sinal da cruz com devoção durante a semana.", 3),
      step("avisos", "Avisos", "Avisos gerais.", 2),
      step("oracao_final", "Oração Final", "Oração ao Espírito Santo.", 5),
    ],
  },
  {
    id: "m4", tema: "Deus Pai Criador", categoria: "Santíssima Trindade",
    leituraBiblica: "Gn 1,1-31 - No princípio Deus criou o céu e a terra",
    materialApoio: "CIC §279-324",
    roteiro: [
      step("acolhida", "Acolhida", "Levar elementos da natureza (folhas, flores, pedras). Observar a beleza da criação.", 10),
      step("oracao_inicial", "Oração Inicial", "Cântico das Criaturas de São Francisco", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Refletir sobre Deus como Pai amoroso que nos criou. A criação como ato de amor.", 20),
      step("dinamica", "Dinâmica", "Painel coletivo: colar imagens da natureza e escrever agradecimentos a Deus Pai.", 15),
      step("compromisso", "Compromisso", "Cuidar da criação: plantar algo ou evitar desperdício.", 5),
      step("avisos", "Avisos", "Informes.", 3),
      step("oracao_final", "Oração Final", "Pai Nosso rezado lentamente.", 5),
    ],
  },
  // Maria
  {
    id: "m5", tema: "Maria, Mãe de Deus e nossa Mãe", categoria: "Maria",
    leituraBiblica: "Lc 1,26-38 - A Anunciação do Anjo a Maria",
    materialApoio: "CIC §484-511; Lumen Gentium Cap. VIII",
    roteiro: [
      step("acolhida", "Acolhida", "Montar um pequeno altar mariano com imagem de Nossa Senhora e flores.", 10),
      step("oracao_inicial", "Oração Inicial", "Ave Maria cantada", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "A história de Maria desde a Anunciação. Seu sim a Deus. Por que é Mãe de Deus e Mãe nossa (Jo 19,26-27).", 20),
      step("dinamica", "Dinâmica", "Escrever uma oração pessoal para Nossa Senhora.", 15),
      step("compromisso", "Compromisso", "Rezar uma Ave Maria todos os dias desta semana.", 3),
      step("avisos", "Avisos", "Avisos.", 3),
      step("oracao_final", "Oração Final", "Salve Rainha.", 5),
    ],
  },
  // Dogmas Marianos
  {
    id: "m6", tema: "A Imaculada Conceição", categoria: "Dogmas Marianos",
    leituraBiblica: "Lc 1,28 - Ave, cheia de graça!",
    materialApoio: "CIC §490-493; Ineffabilis Deus (Pio IX)",
    roteiro: [
      step("acolhida", "Acolhida", "Mostrar imagem de Nossa Senhora da Medalha Milagrosa. Conversar sobre pureza.", 8),
      step("oracao_inicial", "Oração Inicial", "Ofício da Imaculada Conceição", 7, "Ofício Divino"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Explicar que Maria foi preservada do pecado original desde sua concepção. Significado de 'cheia de graça'.", 20),
      step("dinamica", "Dinâmica", "Confeccionar a Medalha Milagrosa em papel e escrever uma graça pedida.", 15),
      step("compromisso", "Compromisso", "Pedir a intercessão de Maria Imaculada por uma intenção especial.", 3),
      step("avisos", "Avisos", "Informes.", 2),
      step("oracao_final", "Oração Final", "Oração à Imaculada Conceição.", 5),
    ],
  },
  {
    id: "m7", tema: "A Assunção de Maria", categoria: "Dogmas Marianos",
    leituraBiblica: "Ap 12,1 - Uma mulher vestida de sol",
    materialApoio: "CIC §966; Munificentissimus Deus (Pio XII)",
    roteiro: [
      step("acolhida", "Acolhida", "Contemplar imagem da Assunção de Maria. Dialogar sobre o céu.", 8),
      step("oracao_inicial", "Oração Inicial", "Magnificat - Cântico de Maria", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Maria foi elevada ao céu em corpo e alma. Significado para nossa fé e esperança na ressurreição.", 20),
      step("dinamica", "Dinâmica", "Fazer um mural com as glórias de Maria nos mistérios do Rosário.", 15),
      step("compromisso", "Compromisso", "Rezar um mistério do Rosário em família.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Consagração a Nossa Senhora.", 5),
    ],
  },
  // Tempo Litúrgico
  {
    id: "m8", tema: "O Ano Litúrgico", categoria: "Tempo Litúrgico",
    leituraBiblica: "Ecl 3,1-8 - Há um tempo para tudo",
    materialApoio: "CIC §1163-1178",
    roteiro: [
      step("acolhida", "Acolhida", "Montar o calendário litúrgico com cores no quadro.", 10),
      step("oracao_inicial", "Oração Inicial", "Oração do tempo litúrgico atual", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Apresentar os tempos litúrgicos: Advento, Natal, Quaresma, Páscoa, Tempo Comum. Cores e significados.", 25),
      step("dinamica", "Dinâmica", "Montar uma roda do ano litúrgico colorida com cartolina.", 15),
      step("compromisso", "Compromisso", "Observar as cores na igreja e identificar o tempo litúrgico atual.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de acordo com o tempo litúrgico vigente.", 5),
    ],
  },
  {
    id: "m9", tema: "A Quaresma e a Conversão", categoria: "Tempo Litúrgico",
    leituraBiblica: "Jl 2,12-13 - Convertei-vos a mim de todo o coração",
    materialApoio: "CIC §1430-1439",
    roteiro: [
      step("acolhida", "Acolhida", "Ambiente com tecido roxo. Perguntar o que significa mudar de vida.", 8),
      step("oracao_inicial", "Oração Inicial", "Salmo 51 - Piedade, Senhor", 5, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Os três pilares da Quaresma: oração, jejum e esmola. O caminho de conversão.", 20),
      step("dinamica", "Dinâmica", "Cada um escreve em um papel algo que deseja mudar e coloca aos pés da cruz.", 15),
      step("compromisso", "Compromisso", "Praticar um ato de caridade e um pequeno jejum esta semana.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Via Sacra resumida.", 5),
    ],
  },
  // História da Igreja
  {
    id: "m10", tema: "O Nascimento da Igreja em Pentecostes", categoria: "História da Igreja",
    leituraBiblica: "At 2,1-13 - A vinda do Espírito Santo",
    materialApoio: "CIC §731-741",
    roteiro: [
      step("acolhida", "Acolhida", "Chamas de papel no ambiente. Perguntar se já sentiram o Espírito Santo.", 10),
      step("oracao_inicial", "Oração Inicial", "Vinde Espírito Santo - Veni Creator Spiritus", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Pentecostes como nascimento da Igreja. Os apóstolos recebem o Espírito e começam a evangelizar.", 20),
      step("dinamica", "Dinâmica", "Cada um recebe uma 'chama' de papel e escreve um dom do Espírito Santo que deseja.", 15),
      step("compromisso", "Compromisso", "Pedir ao Espírito Santo coragem para falar de Jesus.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração ao Espírito Santo.", 5),
    ],
  },
  {
    id: "m11", tema: "Os Primeiros Cristãos", categoria: "História da Igreja",
    leituraBiblica: "At 2,42-47 - A vida da primeira comunidade",
    materialApoio: "CIC §949-953",
    roteiro: [
      step("acolhida", "Acolhida", "Formar uma roda e partilhar um pão. Conversar sobre comunidade.", 10),
      step("oracao_inicial", "Oração Inicial", "Leitura orante de Atos 2,42-47", 7, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Como viviam os primeiros cristãos: oração, partilha, Eucaristia, perseguições e testemunho.", 20),
      step("dinamica", "Dinâmica", "Comparar a vida dos primeiros cristãos com a comunidade hoje. O que podemos melhorar?", 15),
      step("compromisso", "Compromisso", "Participar mais ativamente da vida da comunidade.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pelos cristãos perseguidos hoje.", 5),
    ],
  },
  // Bíblia
  {
    id: "m12", tema: "A Divisão da Bíblia", categoria: "Bíblia",
    leituraBiblica: "2Tm 3,16-17 - Toda Escritura é inspirada por Deus",
    materialApoio: "CIC §101-141; Dei Verbum",
    roteiro: [
      step("acolhida", "Acolhida", "Levar uma Bíblia e deixar todos manusearem. Perguntar se sabem quantos livros tem.", 10),
      step("oracao_inicial", "Oração Inicial", "Salmo 119 - Lâmpada para meus pés", 5, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "AT (46 livros) e NT (27 livros). Pentateuco, históricos, sapienciais, proféticos. Evangelhos, Atos, Cartas, Apocalipse.", 25),
      step("dinamica", "Dinâmica", "Jogo: sortear nomes de livros e os catequizandos classificam em AT ou NT.", 15),
      step("compromisso", "Compromisso", "Ler um capítulo da Bíblia por dia.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pela Palavra de Deus.", 5),
    ],
  },
  // Novíssimos
  {
    id: "m13", tema: "Céu, Purgatório e Inferno", categoria: "Novíssimos",
    leituraBiblica: "Jo 14,2-3 - Na casa do meu Pai há muitas moradas",
    materialApoio: "CIC §1020-1060",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: o que vocês acham que acontece depois da morte?", 10),
      step("oracao_inicial", "Oração Inicial", "Oração pelas almas do purgatório", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "O que a Igreja ensina: Céu (comunhão plena com Deus), Purgatório (purificação), Inferno (separação definitiva). Juízo particular e final.", 25),
      step("dinamica", "Dinâmica", "Debate: como nossas escolhas hoje determinam nosso destino eterno?", 15),
      step("compromisso", "Compromisso", "Rezar pelos fiéis defuntos e viver com esperança no céu.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Credo - profissão de fé na vida eterna.", 5),
    ],
  },
  // Missão
  {
    id: "m14", tema: "A Missão de Todo Batizado", categoria: "Missão",
    leituraBiblica: "Mt 28,18-20 - Ide e fazei discípulos",
    materialApoio: "CIC §849-856; Evangelii Gaudium",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: você já falou de Jesus para alguém?", 8),
      step("oracao_inicial", "Oração Inicial", "Oração dos Missionários", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Todo batizado é missionário. A missão não é só para padres e religiosos. Como ser missionário no dia a dia.", 20),
      step("dinamica", "Dinâmica", "Planejar uma ação missionária para a comunidade.", 15),
      step("compromisso", "Compromisso", "Convidar alguém para a missa ou catequese.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de envio missionário.", 5),
    ],
  },
  // Parábolas
  {
    id: "m15", tema: "A Parábola do Filho Pródigo", categoria: "Parábolas",
    leituraBiblica: "Lc 15,11-32 - O Pai misericordioso",
    materialApoio: "CIC §1439; Misericordiae Vultus",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: vocês já erraram e foram perdoados?", 8),
      step("oracao_inicial", "Oração Inicial", "Salmo 103 - O Senhor é misericordioso", 5, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Leitura e análise da parábola. O amor do Pai, o arrependimento do filho, a inveja do irmão mais velho.", 20),
      step("dinamica", "Dinâmica", "Dramatização da parábola pelos catequizandos.", 20),
      step("compromisso", "Compromisso", "Pedir perdão a alguém e perdoar quem nos magoou.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Ato de contrição.", 5),
    ],
  },
  {
    id: "m16", tema: "A Parábola do Semeador", categoria: "Parábolas",
    leituraBiblica: "Mt 13,1-23 - O semeador saiu a semear",
    materialApoio: "CIC §546",
    roteiro: [
      step("acolhida", "Acolhida", "Levar sementes e diferentes tipos de solo (pedra, espinhos, terra boa).", 10),
      step("oracao_inicial", "Oração Inicial", "Louvor com música sobre a Palavra", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Os quatro tipos de solo representam nosso coração. Como acolhemos a Palavra de Deus?", 20),
      step("dinamica", "Dinâmica", "Plantar uma semente em um copo. Cuidar durante a semana como sinal de fé.", 15),
      step("compromisso", "Compromisso", "Ser 'terra boa': ouvir a Palavra e colocá-la em prática.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pela fecundidade da Palavra.", 5),
    ],
  },
  {
    id: "m17", tema: "A Parábola do Bom Samaritano", categoria: "Parábolas",
    leituraBiblica: "Lc 10,25-37 - Quem é o meu próximo?",
    materialApoio: "CIC §1932; Fratelli Tutti",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: quem é o nosso próximo hoje?", 8),
      step("oracao_inicial", "Oração Inicial", "Oração pela paz e fraternidade", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Análise da parábola: o sacerdote, o levita e o samaritano. Quem realmente amou?", 20),
      step("dinamica", "Dinâmica", "Listar situações do dia a dia onde podemos ser bons samaritanos.", 15),
      step("compromisso", "Compromisso", "Ajudar alguém necessitado esta semana.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de São Francisco - Senhor, fazei-me instrumento.", 5),
    ],
  },
  {
    id: "m18", tema: "A Parábola das Dez Virgens", categoria: "Parábolas",
    leituraBiblica: "Mt 25,1-13 - Vigiai, pois não sabeis o dia nem a hora",
    materialApoio: "CIC §672; 1036",
    roteiro: [
      step("acolhida", "Acolhida", "Acender velas no ambiente. Perguntar sobre estar preparado.", 8),
      step("oracao_inicial", "Oração Inicial", "Oração de vigilância", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "A importância da vigilância e da preparação espiritual. As virgens prudentes e as insensatas.", 20),
      step("dinamica", "Dinâmica", "Cada um decora sua própria 'lâmpada' de papel com compromissos de fé.", 15),
      step("compromisso", "Compromisso", "Manter a 'lâmpada acesa': oração diária e boas obras.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Maranatha - Vem, Senhor Jesus!", 5),
    ],
  },
  // Vida de Jesus
  {
    id: "m19", tema: "A Anunciação e o Natal de Jesus", categoria: "Vida de Jesus",
    leituraBiblica: "Lc 2,1-20 - O nascimento de Jesus",
    materialApoio: "CIC §484-486; 525-526",
    roteiro: [
      step("acolhida", "Acolhida", "Montar um presépio simples. Conversar sobre o Natal verdadeiro.", 10),
      step("oracao_inicial", "Oração Inicial", "Noite Feliz ou canto natalino", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Da Anunciação ao Nascimento: o sim de Maria, a viagem a Belém, o nascimento na manjedoura, os pastores e os magos.", 25),
      step("dinamica", "Dinâmica", "Montar um presépio com materiais recicláveis.", 15),
      step("compromisso", "Compromisso", "Viver o espírito do Natal: simplicidade e partilha.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração diante do presépio.", 5),
    ],
  },
  {
    id: "m20", tema: "A Via Sacra de Jesus", categoria: "Vida de Jesus",
    leituraBiblica: "Lc 23,26-49 - A crucificação de Jesus",
    materialApoio: "CIC §595-623",
    roteiro: [
      step("acolhida", "Acolhida", "Ambiente com cruz e tecido roxo. Momento de silêncio.", 8),
      step("oracao_inicial", "Oração Inicial", "Canto penitencial", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "As 14 estações da Via Sacra: da condenação ao sepultamento. O significado de cada estação para nossa vida.", 25),
      step("dinamica", "Dinâmica", "Percorrer as estações pelo espaço com imagens e orações em cada parada.", 20),
      step("compromisso", "Compromisso", "Carregar com paciência as cruzes do dia a dia.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração diante do crucifixo.", 5),
    ],
  },
  // Cartas de Paulo
  {
    id: "m21", tema: "São Paulo e suas Cartas", categoria: "Cartas de Paulo",
    leituraBiblica: "1Cor 13,1-13 - O Hino ao Amor",
    materialApoio: "CIC §2705; Introdução às Cartas Paulinas",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: vocês já escreveram uma carta para alguém?", 8),
      step("oracao_inicial", "Oração Inicial", "Oração de São Paulo pela comunidade", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Quem foi São Paulo: de perseguidor a apóstolo. Suas viagens missionárias e cartas às comunidades.", 20),
      step("dinamica", "Dinâmica", "Escrever uma 'carta' à comunidade, inspirados em Paulo.", 15),
      step("compromisso", "Compromisso", "Ler um trecho de uma carta de Paulo cada dia.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Bênção paulina: A graça do Senhor Jesus esteja convosco.", 5),
    ],
  },
  // Antigo Testamento
  {
    id: "m22", tema: "A Criação do Mundo", categoria: "Antigo Testamento",
    leituraBiblica: "Gn 1,1 - 2,4 - A criação em sete dias",
    materialApoio: "CIC §279-324; Laudato Si'",
    roteiro: [
      step("acolhida", "Acolhida", "Levar fotos da natureza. Perguntar: de onde veio tudo isso?", 10),
      step("oracao_inicial", "Oração Inicial", "Cântico das Criaturas", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Os sete dias da criação como narrativa teológica. O ser humano como imagem e semelhança de Deus.", 20),
      step("dinamica", "Dinâmica", "Fazer um mural dos 7 dias da criação com desenhos e colagens.", 15),
      step("compromisso", "Compromisso", "Agradecer a Deus pela criação e cuidar do meio ambiente.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pela casa comum.", 5),
    ],
  },
  {
    id: "m23", tema: "Os Patriarcas: Abraão, Isaac e Jacó", categoria: "Antigo Testamento",
    leituraBiblica: "Gn 12,1-4 - A vocação de Abraão",
    materialApoio: "CIC §59-61; 145-147",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: vocês já tiveram que confiar em alguém sem saber o resultado?", 8),
      step("oracao_inicial", "Oração Inicial", "Oração de confiança em Deus", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "A história dos patriarcas: a fé de Abraão, a promessa a Isaac, as 12 tribos de Jacó. A aliança de Deus.", 25),
      step("dinamica", "Dinâmica", "Árvore genealógica dos patriarcas montada em grupo.", 15),
      step("compromisso", "Compromisso", "Confiar em Deus mesmo quando o caminho é incerto.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de Abraão: Creio, Senhor!", 5),
    ],
  },
  {
    id: "m24", tema: "Moisés e a Libertação do Egito", categoria: "Antigo Testamento",
    leituraBiblica: "Ex 3,1-15 - A sarça ardente",
    materialApoio: "CIC §62-64; 2575-2577",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: de que situações difíceis vocês gostariam de ser libertados?", 10),
      step("oracao_inicial", "Oração Inicial", "Cântico de Moisés - Ex 15", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "A história de Moisés: nascimento, sarça ardente, pragas, travessia do Mar Vermelho, os 10 mandamentos.", 25),
      step("dinamica", "Dinâmica", "Os 10 mandamentos escritos em 'tábuas' de cartolina para levar para casa.", 15),
      step("compromisso", "Compromisso", "Viver um dos mandamentos de forma concreta.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pelos que sofrem escravidão hoje.", 5),
    ],
  },
  // Sacramentos
  {
    id: "m25", tema: "Os Sete Sacramentos", categoria: "Sacramentos",
    leituraBiblica: "Mt 28,19-20 - Batizando-os em nome do Pai...",
    materialApoio: "CIC §1210-1666",
    roteiro: [
      step("acolhida", "Acolhida", "Levar símbolos: água, óleo, pão, vinho, anel, estola. Perguntar o que representam.", 10),
      step("oracao_inicial", "Oração Inicial", "Oração pelos sacramentos recebidos", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Os 7 sacramentos: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem, Matrimônio.", 25),
      step("dinamica", "Dinâmica", "Jogo da memória com símbolos e nomes dos sacramentos.", 15),
      step("compromisso", "Compromisso", "Participar do sacramento da reconciliação esta semana.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de ação de graças pelos sacramentos.", 5),
    ],
  },
  // Moral e Ética
  {
    id: "m26", tema: "Os Dez Mandamentos", categoria: "Moral e Ética",
    leituraBiblica: "Ex 20,1-17 - Os mandamentos de Deus",
    materialApoio: "CIC §2052-2082",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: por que existem regras? O que aconteceria sem elas?", 8),
      step("oracao_inicial", "Oração Inicial", "Salmo 19 - A lei do Senhor é perfeita", 5, "Leitura Orante"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Os 10 mandamentos como caminho de amor a Deus e ao próximo. Jesus resume em dois mandamentos.", 20),
      step("dinamica", "Dinâmica", "Cada grupo recebe mandamentos e cria situações do cotidiano onde se aplicam.", 15),
      step("compromisso", "Compromisso", "Viver conscientemente um mandamento por dia.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de compromisso com a lei de Deus.", 5),
    ],
  },
  // Oração
  {
    id: "m27", tema: "O Pai Nosso - A Oração do Senhor", categoria: "Oração",
    leituraBiblica: "Mt 6,9-13 - Quando orardes, dizei: Pai nosso...",
    materialApoio: "CIC §2759-2865",
    roteiro: [
      step("acolhida", "Acolhida", "Rezar o Pai Nosso juntos e perguntar se entendem cada parte.", 8),
      step("oracao_inicial", "Oração Inicial", "Pai Nosso cantado", 5, "Celebrativo"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Analisar cada pedido do Pai Nosso: significado e implicações para a vida cristã.", 25),
      step("dinamica", "Dinâmica", "Escrever o Pai Nosso com as próprias palavras.", 15),
      step("compromisso", "Compromisso", "Rezar o Pai Nosso com atenção todas as manhãs.", 3),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Pai Nosso meditado lentamente.", 5),
    ],
  },
  // More parables
  {
    id: "m28", tema: "A Parábola dos Talentos", categoria: "Parábolas",
    leituraBiblica: "Mt 25,14-30 - A parábola dos talentos",
    materialApoio: "CIC §1880; Christifideles Laici",
    roteiro: [
      step("acolhida", "Acolhida", "Perguntar: quais são seus talentos e habilidades?", 8),
      step("oracao_inicial", "Oração Inicial", "Oração de oferta dos dons", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "Deus dá talentos a cada um. Somos responsáveis por multiplicá-los para o bem do Reino.", 20),
      step("dinamica", "Dinâmica", "Cada um lista 3 talentos e como pode usá-los a serviço da comunidade.", 15),
      step("compromisso", "Compromisso", "Usar um talento para ajudar alguém esta semana.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração de oferta pessoal.", 5),
    ],
  },
  {
    id: "m29", tema: "A Parábola do Joio e do Trigo", categoria: "Parábolas",
    leituraBiblica: "Mt 13,24-30.36-43 - O joio e o trigo",
    materialApoio: "CIC §681-682",
    roteiro: [
      step("acolhida", "Acolhida", "Mostrar imagens de trigo e joio. Perguntar se sabem a diferença.", 8),
      step("oracao_inicial", "Oração Inicial", "Oração de discernimento", 5, "Oração Simples"),
      step("desenvolvimento", "Desenvolvimento do Tema", "O bem e o mal coexistem. A paciência de Deus. O juízo final e a misericórdia divina.", 20),
      step("dinamica", "Dinâmica", "Separar em dois grupos: ações que são 'trigo' e ações que são 'joio' em nossa vida.", 15),
      step("compromisso", "Compromisso", "Cultivar o 'trigo': fazer o bem mesmo quando o mal está presente.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pela conversão dos pecadores.", 5),
    ],
  },
  {
    id: "m30", tema: "A Parábola da Ovelha Perdida", categoria: "Parábolas",
    leituraBiblica: "Lc 15,1-7 - Alegria pela ovelha reencontrada",
    materialApoio: "CIC §545; 1443",
    roteiro: [
      step("acolhida", "Acolhida", "Esconder uma ovelha de pelúcia ou papel. Pedir que encontrem.", 10),
      step("oracao_inicial", "Oração Inicial", "Salmo 23 cantado", 5, "Louvor"),
      step("desenvolvimento", "Desenvolvimento do Tema", "O amor de Deus por cada pessoa. Ele deixa as 99 para buscar a que se perdeu.", 20),
      step("dinamica", "Dinâmica", "Cada um escreve o nome de alguém que está 'perdido' e reza por essa pessoa.", 15),
      step("compromisso", "Compromisso", "Acolher quem está afastado da comunidade.", 5),
      step("avisos", "Avisos", "Avisos.", 2),
      step("oracao_final", "Oração Final", "Oração pelos que estão longe de Deus.", 5),
    ],
  },
];
