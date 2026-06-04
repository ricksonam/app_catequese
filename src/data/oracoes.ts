export type CategoriaOracao = 
  | 'Diárias'
  | 'Marianas'
  | 'Terço e Rosário'
  | 'Diversas Circunstâncias'
  | 'Eucarísticas'
  | 'Catequizandos'
  | 'Catequistas'
  | 'Refeições'
  | 'Famílias e Grupos'
  | 'Saúde e Paz';

export interface Oracao {
  id: string;
  titulo: string;
  categoria: CategoriaOracao;
  texto: string;
  descricao?: string;
  tags: string[];
}

export const categoriasOracao: CategoriaOracao[] = [
  'Diárias',
  'Catequizandos',
  'Catequistas',
  'Refeições',
  'Famílias e Grupos',
  'Saúde e Paz',
  'Marianas',
  'Terço e Rosário',
  'Eucarísticas',
  'Diversas Circunstâncias',
];

export const oracoesBase: Oracao[] = [
  // ── DIÁRIAS ──────────────────────────────────────────────────────────
  {
    id: "sinal-da-cruz",
    titulo: "Sinal da Cruz",
    categoria: "Diárias",
    texto: "Pelo sinal da Santa Cruz,\nlivrai-nos, Deus, nosso Senhor,\ndos nossos inimigos.\n\nEm nome do Pai e do Filho e do Espírito Santo. Amém.",
    tags: ["sinal", "cruz", "inicio", "diaria"]
  },
  {
    id: "pai-nosso",
    titulo: "Pai Nosso",
    categoria: "Diárias",
    texto: "Pai Nosso que estais nos Céus,\nsantificado seja o vosso Nome,\nvenha a nós o vosso Reino,\nseja feita a vossa vontade\nassim na terra como no Céu.\n\nO pão nosso de cada dia nos dai hoje,\nperdoai-nos as nossas ofensas\nassim como nós perdoamos\na quem nos tem ofendido,\ne não nos deixeis cair em tentação,\nmas livrai-nos do Mal. Amém.",
    tags: ["pai", "nosso", "diaria", "basica"]
  },
  {
    id: "ave-maria",
    titulo: "Ave Maria",
    categoria: "Marianas",
    texto: "Ave Maria, cheia de graça,\no Senhor é convosco,\nbendita sois vós entre as mulheres\ne bendito é o fruto do vosso ventre, Jesus.\n\nSanta Maria, Mãe de Deus,\nrogai por nós pecadores,\nagora e na hora da nossa morte. Amém.",
    tags: ["ave", "maria", "mariana", "diaria", "basica"]
  },
  {
    id: "gloria-ao-pai",
    titulo: "Glória ao Pai",
    categoria: "Diárias",
    texto: "Glória ao Pai e ao Filho e ao Espírito Santo.\nComo era no princípio, agora e sempre. Amém.",
    tags: ["gloria", "pai", "trindade", "basica"]
  },
  {
    id: "oracao-da-manha",
    titulo: "Oração da Manhã",
    categoria: "Diárias",
    descricao: "Para começar o dia com Deus",
    texto: "Senhor Deus,\nao despertar para este novo dia,\nquero oferecer-Vos cada momento,\ncada pensamento, cada palavra e cada ação.\n\nGuiai meus passos pelo caminho do bem.\nIluminai minha mente para conhecer a Vossa vontade.\nAquentai o meu coração com o fogo do Vosso amor.\n\nQue este dia seja vivido em plena comunhão convosco,\nem favor do meu próximo e para a Vossa glória.\n\nEm nome do Pai, do Filho e do Espírito Santo. Amém.",
    tags: ["manha", "matin", "diaria", "inicio do dia"]
  },
  {
    id: "oracao-da-tarde",
    titulo: "Oração da Tarde",
    categoria: "Diárias",
    descricao: "Para o meio do dia — ação de graças e renovação",
    texto: "Senhor Jesus,\nno meio deste dia que passa,\nparo diante de Vós para agradecer.\n\nObrigado pelo dom da vida,\npelas pessoas que encontrei,\npelas oportunidades de servir e amar.\n\nPerdoai-me onde errei.\nRenovai em mim a disposição de fazer o bem.\nQue a tarde que ainda tenho pela frente\nseja cheia da Vossa presença e da Vossa graça.\n\nMaria, rogai por nós. Amém.",
    tags: ["tarde", "meio dia", "acao de gracas", "diaria"]
  },
  {
    id: "oracao-da-noite",
    titulo: "Oração da Noite",
    categoria: "Diárias",
    descricao: "Para encerrar o dia com gratidão e paz",
    texto: "Senhor,\nao final deste dia me deito em paz.\n\nGraças Vos dou por tudo que me destes:\npeço perdão pelos meus pecados e falhas.\nProtegei-me durante esta noite.\nAfastai de mim todo o mal.\n\nQue o descanso renove minhas forças\npara servir-Vos com mais amor amanhã.\nComo a Vós confio meu dia, confio também minha noite.\n\nEm Vossas mãos entrego o meu espírito. Amém.",
    tags: ["noite", "dormir", "exame", "descanso", "diaria"]
  },
  {
    id: "oracao-espirito-santo",
    titulo: "Vinde Espírito Santo",
    categoria: "Diárias",
    texto: "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do Vosso amor.\nEnviai o Vosso Espírito e tudo será criado,\ne renovareis a face da terra.\n\nOremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos da sua consolação. Por Cristo Senhor Nosso. Amém.",
    tags: ["espirito santo", "pentecostes", "vinde"]
  },
  {
    id: "creio-apostolos",
    titulo: "Creio (Símbolo dos Apóstolos)",
    categoria: "Diárias",
    texto: "Creio em Deus Pai Todo-Poderoso,\ncriador do céu e da terra.\nE em Jesus Cristo, seu único Filho, nosso Senhor,\nque foi concebido pelo poder do Espírito Santo;\nnasceu da Virgem Maria;\npadeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado.\nDesceu à mansão dos mortos;\nressuscitou ao terceiro dia;\nsubiu aos céus;\nestá sentado à direita de Deus Pai Todo-Poderoso,\nonde há de vir a julgar os vivos e os mortos.\n\nCreio no Espírito Santo;\nna Santa Igreja Católica;\nna comunhão dos santos;\nna remissão dos pecados;\nna ressurreição da carne;\nna vida eterna. Amém.",
    tags: ["creio", "fe", "apostolos", "basica", "terço"]
  },

  // ── CATEQUIZANDOS ─────────────────────────────────────────────────────
  {
    id: "oracao-catequizando",
    titulo: "Oração dos Catequizandos",
    categoria: "Catequizandos",
    descricao: "Para os que estão em caminho de fé",
    texto: "Senhor Jesus,\nEstou aqui, diante de Vós,\nem busca da Vossa presença.\n\nSou catequizando(a), estou aprendendo a conhecer-Vos,\na amá-Vos e a seguir os Vossos caminhos.\nAjudai-me a ouvir com o coração,\na guardar as palavras que aprendo\ne a vivê-las em minha vida de cada dia.\n\nQue eu cresça na fé, na esperança e na caridade.\nQue seja um(a) verdadeiro(a) discípulo(a) Vosso.\nMaria, nossa Mãe, guia meus passos. Amém.",
    tags: ["catequizando", "iniciacao", "fe", "aprender", "discipulo"]
  },
  {
    id: "oracao-antes-catequese",
    titulo: "Oração Antes da Catequese",
    categoria: "Catequizandos",
    descricao: "Para rezar no início do encontro",
    texto: "Senhor Jesus, estamos aqui reunidos em Vosso nome.\nAbri nossas mentes e nossos corações\npara receber a Palavra de Deus.\n\nEnviai o Vosso Espírito Santo\nque nos ilumine, nos ensine e nos conduza.\nQue este momento seja de encontro verdadeiro Convosco.\n\nNossa Senhora da Catequese, rogai por nós!\nAmém.",
    tags: ["catequese", "inicio", "encontro", "abertura"]
  },
  {
    id: "oracao-encerramento-catequese",
    titulo: "Oração de Encerramento da Catequese",
    categoria: "Catequizandos",
    descricao: "Para rezar ao final do encontro",
    texto: "Obrigado, Senhor,\npor este tempo de graça que passamos juntos.\n\nLevamos em nossos corações as sementes da Vossa Palavra.\nAjudai-nos a cultivá-las em nossa vida,\nna família, na escola, nas amizades.\n\nQue tudo o que aprendemos hoje\nnos torne mais próximos de Vós.\nAté o próximo encontro, Senhor. Amém.",
    tags: ["catequese", "encerramento", "final", "sementes"]
  },

  // ── CATEQUISTAS ───────────────────────────────────────────────────────
  {
    id: "oracao-catequista",
    titulo: "Oração do Catequista",
    categoria: "Catequistas",
    descricao: "Para o catequista antes de ministrar",
    texto: "Senhor Jesus,\nVós que chamaste os apóstolos e os enviastes a anunciar o Evangelho,\nchamastes-me também a este ministério da catequese.\n\nFazei-me instrumento da Vossa graça.\nDai-me palavras que toquem os corações.\nDai-me paciência para esperar os tempos de cada um.\nDai-me sabedoria para transmitir a Vossa verdade.\nDai-me amor para acolher cada catequizando(a) como filho(a) Vosso.\n\nNão sou digno(a) desta missão,\nmas confio que é o Vosso Espírito quem age em mim.\nQue eu diminua e Vós aumenteis. Amém.",
    tags: ["catequista", "missao", "ministerio", "formacao"]
  },
  {
    id: "oracao-catequista-forca",
    titulo: "Oração do Catequista pela Força",
    categoria: "Catequistas",
    descricao: "Quando o cansaço bate na missão",
    texto: "Senhor, hoje estou cansado(a).\nOs desafios parecem maiores do que minhas forças.\n\nMas lembro que não é minha missão, é a Vossa.\nNão são minhas palavras, são as Vossas.\nNão sou eu quem salva, sois Vós.\n\nRenovai em mim o entusiasmo do início.\nReacendei a chama do amor que me trouxe até aqui.\nQue eu não desanime diante das dificuldades.\n\nEu creio que cada semente plantada,\nainda que eu não veja o fruto,\nfaz diferença na vida de alguém.\nObrigado por me escolher para esta missão. Amém.",
    tags: ["catequista", "forca", "cansaco", "perseveranca"]
  },

  // ── REFEIÇÕES ─────────────────────────────────────────────────────────
  {
    id: "oracao-antes-refeicao",
    titulo: "Oração Antes das Refeições",
    categoria: "Refeições",
    descricao: "Para abençoar o alimento",
    texto: "Abençoai, Senhor,\neste alimento que vamos receber\ne a todos que o prepararam.\n\nQue nos fortaleça para servir-Vos\ne seja partilhado com quem tem fome.\nPor Cristo, Senhor Nosso. Amém.",
    tags: ["refeicao", "almoco", "janta", "bencao", "alimento", "cafe"]
  },
  {
    id: "oracao-apos-refeicao",
    titulo: "Oração Após as Refeições",
    categoria: "Refeições",
    descricao: "Ação de graças depois de comer",
    texto: "Graças Vos damos, Senhor Todo-Poderoso,\npor todos os Vossos benefícios,\nque viveis e reinais pelos séculos dos séculos. Amém.\n\nO Senhor vos dê a paz.",
    tags: ["refeicao", "acao de gracas", "apos", "gratidao"]
  },
  {
    id: "oracao-lanchinhos-criancas",
    titulo: "Benção das Crianças à Mesa",
    categoria: "Refeições",
    descricao: "Simples e bonita para os pequenos",
    texto: "Obrigado, Jesus,\npelo nosso lanchinho de hoje!\nObrigado a quem preparou com amor.\n\nQue possamos partilhar com os amigos\ne lembrar de quem não tem. Amém!",
    tags: ["criancas", "lanche", "refeicao", "simples", "catequizandos"]
  },

  // ── FAMÍLIAS E GRUPOS ─────────────────────────────────────────────────
  {
    id: "oracao-bencao-familias",
    titulo: "Oração de Bênção pelas Famílias",
    categoria: "Famílias e Grupos",
    descricao: "Para abençoar as famílias dos catequizandos",
    texto: "Senhor Deus,\nque instituístes a família como sinal do Vosso amor,\nabençoai as famílias dos nossos catequizandos.\n\nQue em cada lar haja paz, amor e perdão.\nQue os pais sejam modelos de fé para os filhos.\nQue os filhos cresçam na sabedoria e na graça.\nQue o diálogo vença o silêncio,\ne o perdão vença a mágoa.\n\nSagrada Família de Nazaré,\nmodelo de toda a família cristã,\nprotegei e abençoai as nossas famílias. Amém.",
    tags: ["familia", "bencao", "pais", "filhos", "lar", "sagrada familia"]
  },
  {
    id: "oracao-pelas-criancas",
    titulo: "Oração pelas Crianças",
    categoria: "Famílias e Grupos",
    descricao: "Pelo bem das crianças da catequese",
    texto: "Senhor Jesus,\nVós que dissestes: 'Deixai as crianças virem a Mim',\nabençoai cada criança que está sob nossos cuidados.\n\nProtegei-as do mal,\niluминai-as com a luz do Vosso amor,\nalegrai-as com a Vossa presença.\nQue cresçam saudáveis, felizes e fiéis.\n\nQue nenhuma criança falte de amor,\nde alimento, de educação e de fé.\n\nMaria, Mãe de Jesus Menino,\ncobri com o Vosso manto cada uma delas. Amém.",
    tags: ["criancas", "protecao", "infancia", "jesus menino"]
  },
  {
    id: "oracao-pelos-jovens",
    titulo: "Oração pelos Jovens",
    categoria: "Famílias e Grupos",
    descricao: "Pelos adolescentes e jovens em formação",
    texto: "Senhor Jesus,\nque fostes jovem como eles,\nabençoai os nossos jovens.\n\nNum mundo cheio de apelos,\nde modas passageiras e de tantas confusões,\ndai-lhes a coragem de seguir o Vosso caminho.\n\nQue sejam jovens apaixonados pelo Evangelho,\ncorajosos para dizer 'não' ao que afasta de Vós\ne 'sim' a tudo que é verdadeiro, bom e belo.\n\nQue a juventude seja vivida com alegria e dignidade.\nMaria, jovem de Nazaré, rogai por eles. Amém.",
    tags: ["jovens", "adolescentes", "juventude", "coragem", "fe"]
  },
  {
    id: "oracao-pelos-idosos",
    titulo: "Oração pelos Idosos",
    categoria: "Famílias e Grupos",
    descricao: "Pelos avós e idosos das nossas comunidades",
    texto: "Senhor,\nde joelhos diante de Vós,\npeço por nossos idosos.\n\nPelas avós e avôs que nos ensinaram a fé pela vida,\npelos anciãos que carregam memória e sabedoria,\npelos que estão sozinhos, esquecidos ou enfermos.\n\nDai-lhes conforto no sofrimento,\ncompanhia na solidão,\npaz nos últimos anos de vida.\n\nQue possamos olhá-los com respeito e gratidão,\nvendo neles um tesouro e não um fardo.\n\nQue passem desta vida para a Vossa glória eterna. Amém.",
    tags: ["idosos", "avos", "terceira idade", "conforto", "memoria"]
  },

  // ── SAÚDE E PAZ ───────────────────────────────────────────────────────
  {
    id: "oracao-pela-paz",
    titulo: "Oração pela Paz",
    categoria: "Saúde e Paz",
    descricao: "Baseada na famosa oração de São Francisco",
    texto: "Senhor, fazei de mim um instrumento de Vossa paz.\nOnde houver ódio, que eu leve o amor;\nonde houver ofensa, que eu leve o perdão;\nonde houver discórdia, que eu leve a união;\nonde houver dúvida, que eu leve a fé;\nonde houver erro, que eu leve a verdade;\nonde houver desespero, que eu leve a esperança;\nonde houver tristeza, que eu leve a alegria;\nonde houver trevas, que eu leve a luz.\n\nÓ Mestre, fazei que eu procure mais consolar que ser consolado,\ncompreender que ser compreendido,\namar que ser amado.\n\nPois é dando que se recebe,\né perdoando que se é perdoado,\ne é morrendo que se vive para a vida eterna. Amém.",
    tags: ["paz", "sao francisco", "instrumento", "perdao", "amor"]
  },
  {
    id: "oracao-pela-saude",
    titulo: "Oração pela Saúde",
    categoria: "Saúde e Paz",
    descricao: "Para os doentes e seus familiares",
    texto: "Senhor Jesus Cristo,\nque durante a Vossa vida terrena curastes tantos enfermos,\nolhai com misericórdia para os que sofrem.\n\nDai-lhes alívio na dor,\nesperança no sofrimento,\nforça para suportar a doença.\n\nAbençoai os médicos, enfermeiros e cuidadores\nque se dedicam ao serviço dos enfermos.\n\nAjudai-nos a ver em cada doente o próprio Cristo,\ne a servi-lo com amor e compaixão.\n\nSenhora da Saúde, rogai por nós. Amém.",
    tags: ["saude", "doentes", "cura", "enfermidade", "medicos"]
  },

  // ── MARIANAS ──────────────────────────────────────────────────────────
  {
    id: "salve-rainha",
    titulo: "Salve Rainha",
    categoria: "Marianas",
    texto: "Salve, Rainha, Mãe de misericórdia,\nvida, doçura e esperança nossa, salve!\nA vós bradamos, os degredados filhos de Eva;\na vós suspiramos, gemendo e chorando neste vale de lágrimas.\n\nEia, pois, advogada nossa,\nesses vossos olhos misericordiosos a nós volvei;\ne depois deste desterro nos mostrai Jesus,\nbendito fruto do vosso ventre,\nó clemente, ó piedosa, ó doce sempre Virgem Maria.\n\nRogai por nós, santa Mãe de Deus.\nPara que sejamos dignos das promessas de Cristo. Amém.",
    tags: ["salve", "rainha", "mariana", "terço"]
  },
  {
    id: "angelus",
    titulo: "Angelus",
    categoria: "Marianas",
    descricao: "Rezado tradicionalmente às 6h, 12h e 18h",
    texto: "V. O Anjo do Senhor anunciou a Maria.\nR. E ela concebeu do Espírito Santo.\nAve Maria...\n\nV. Eis aqui a serva do Senhor.\nR. Faça-se em mim segundo a vossa palavra.\nAve Maria...\n\nV. E o Verbo se fez carne.\nR. E habitou entre nós.\nAve Maria...\n\nV. Rogai por nós, Santa Mãe de Deus.\nR. Para que sejamos dignos das promessas de Cristo.\n\nOremos: Infundi, Senhor, nós Vos pedimos, a vossa graça em nossas almas, para que nós, que pela anunciação do Anjo conhecemos a encarnação de Jesus Cristo, vosso Filho, pela sua paixão e morte na cruz, sejamos conduzidos à glória da ressurreição. Por Nosso Senhor Jesus Cristo. Amém.",
    tags: ["angelus", "anjo", "mariana", "meio dia"]
  },
  {
    id: "consagracao-nossa-senhora",
    titulo: "Consagração a Nossa Senhora",
    categoria: "Marianas",
    texto: "Ó minha Senhora e minha Mãe,\neu me ofereço todo(a) a vós,\ne em prova da minha devoção para convosco,\nvos consagro neste dia e para sempre:\nos meus olhos, os meus ouvidos, a minha boca,\no meu coração e inteiramente todo o meu ser.\nE porque assim sou vosso(a), ó incomparável Mãe,\nguardai-me e defendei-me como propriedade e possessão vossa. Amém.",
    tags: ["consagracao", "nossa senhora", "maria"]
  },

  // ── TERÇO E ROSÁRIO ───────────────────────────────────────────────────
  {
    id: "misterios-gozosos",
    titulo: "Mistérios Gozosos (Segunda e Sábado)",
    categoria: "Terço e Rosário",
    texto: "1º Mistério: A Anunciação do Arcanjo Gabriel a Nossa Senhora.\n2º Mistério: A Visitação de Nossa Senhora a sua prima Santa Isabel.\n3º Mistério: O Nascimento do Menino Jesus em Belém.\n4º Mistério: A Apresentação do Menino Jesus no Templo.\n5º Mistério: O Encontro do Menino Jesus no Templo.",
    tags: ["misterios", "gozosos", "terço", "rosario", "segunda", "sabado"]
  },
  {
    id: "misterios-luminosos",
    titulo: "Mistérios Luminosos (Quinta-feira)",
    categoria: "Terço e Rosário",
    texto: "1º Mistério: O Batismo de Jesus no rio Jordão.\n2º Mistério: O primeiro milagre de Jesus nas Bodas de Caná.\n3º Mistério: O anúncio do Reino de Deus e o convite à conversão.\n4º Mistério: A Transfiguração de Jesus no monte Tabor.\n5º Mistério: A Instituição da Eucaristia.",
    tags: ["misterios", "luminosos", "terço", "rosario", "quinta"]
  },
  {
    id: "misterios-dolorosos",
    titulo: "Mistérios Dolorosos (Terça e Sexta)",
    categoria: "Terço e Rosário",
    texto: "1º Mistério: A Agonia de Jesus no Horto das Oliveiras.\n2º Mistério: A Flagelação de Jesus atado à coluna.\n3º Mistério: A Coroação de espinhos de Jesus.\n4º Mistério: A subida de Jesus ao Calvário carregando a Cruz.\n5º Mistério: A Crucifixão e morte de Jesus.",
    tags: ["misterios", "dolorosos", "terço", "rosario", "terca", "sexta", "paixao"]
  },
  {
    id: "misterios-gloriosos",
    titulo: "Mistérios Gloriosos (Quarta e Domingo)",
    categoria: "Terço e Rosário",
    texto: "1º Mistério: A Ressurreição de Jesus.\n2º Mistério: A Ascensão de Jesus ao Céu.\n3º Mistério: A vinda do Espírito Santo sobre Maria e os Apóstolos.\n4º Mistério: A Assunção de Nossa Senhora ao Céu.\n5º Mistério: A Coroação de Nossa Senhora como Rainha do Céu e da Terra.",
    tags: ["misterios", "gloriosos", "terço", "rosario", "quarta", "domingo"]
  },

  // ── EUCARÍSTICAS ──────────────────────────────────────────────────────
  {
    id: "alma-de-cristo",
    titulo: "Alma de Cristo",
    categoria: "Eucarísticas",
    texto: "Alma de Cristo, santificai-me.\nCorpo de Cristo, salvai-me.\nSangue de Cristo, inebriai-me.\nÁgua do lado de Cristo, lavai-me.\nPaixão de Cristo, confortai-me.\nÓ bom Jesus, ouvi-me.\nDentro de vossas chagas, escondei-me.\nNão permitais que me separe de Vós.\nDo espírito maligno defendei-me.\nNa hora da morte chamai-me\ne mandai-me ir para Vós,\npara que com vossos Santos Vos louve\npor todos os séculos dos séculos. Amém.",
    tags: ["alma", "cristo", "comunhao", "eucaristia", "santo inacio"]
  },
  {
    id: "comunhao-espiritual",
    titulo: "Comunhão Espiritual",
    categoria: "Eucarísticas",
    texto: "Meu Jesus, eu creio que estais presente no Santíssimo Sacramento do Altar.\nAmo-Vos sobre todas as coisas e minha alma suspira por Vós.\nMas, como não posso receber-Vos agora no Santíssimo Sacramento,\nvinde, ao menos espiritualmente, ao meu coração.\nAbraço-me convosco como se já estivésseis comigo:\nuno-me Convosco inteiramente.\nAh! não permitais que eu torne a separar-me de Vós! Amém.",
    tags: ["comunhao", "espiritual", "eucaristia", "missa"]
  },

  // ── DIVERSAS CIRCUNSTÂNCIAS ───────────────────────────────────────────
  {
    id: "sao-miguel",
    titulo: "Oração a São Miguel Arcanjo",
    categoria: "Diversas Circunstâncias",
    texto: "São Miguel Arcanjo, defendei-nos no combate;\nSede o nosso refúgio contra as maldades e ciladas do demônio.\nOrdene-lhe Deus, instantemente o pedimos;\ne vós, príncipe da milícia celeste, pelo poder divino,\nprecipitai no inferno a Satanás e a todos os espíritos malignos\nque andam pelo mundo para perder as almas. Amém.",
    tags: ["miguel", "arcanjo", "protecao", "combate"]
  },

];\n