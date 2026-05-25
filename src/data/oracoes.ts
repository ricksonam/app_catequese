export type CategoriaOracao = 
  | 'Diárias'
  | 'Marianas'
  | 'Terço e Rosário'
  | 'Diversas Circunstâncias'
  | 'Tempos Litúrgicos'
  | 'Eucarísticas';

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
  'Marianas',
  'Terço e Rosário',
  'Eucarísticas',
  'Diversas Circunstâncias',
  'Tempos Litúrgicos'
];

export const oracoesBase: Oracao[] = [
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
    id: "salve-rainha",
    titulo: "Salve Rainha",
    categoria: "Marianas",
    texto: "Salve, Rainha, Mãe de misericórdia,\nvida, doçura e esperança nossa, salve!\nA vós bradamos, os degredados filhos de Eva;\na vós suspiramos, gemendo e chorando neste vale de lágrimas.\n\nEia, pois, advogada nossa,\nesses vossos olhos misericordiosos a nós volvei;\ne depois deste desterro nos mostrai Jesus,\nbendito fruto do vosso ventre,\nó clemente, ó piedosa, ó doce sempre Virgem Maria.\n\nRogai por nós, santa Mãe de Deus.\nPara que sejamos dignos das promessas de Cristo. Amém.",
    tags: ["salve", "rainha", "mariana", "terço"]
  },
  {
    id: "creio-apostolos",
    titulo: "Creio (Símbolo dos Apóstolos)",
    categoria: "Diárias",
    texto: "Creio em Deus Pai Todo-Poderoso,\ncriador do céu e da terra.\nE em Jesus Cristo, seu único Filho, nosso Senhor,\nque foi concebido pelo poder do Espírito Santo;\nnasceu da Virgem Maria;\npadeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado.\nDesceu à mansão dos mortos;\nressuscitou ao terceiro dia;\nsubiu aos céus;\nestá sentado à direita de Deus Pai Todo-Poderoso,\ndonde há de vir a julgar os vivos e os mortos.\n\nCreio no Espírito Santo;\nna Santa Igreja Católica;\nna comunhão dos santos;\nna remissão dos pecados;\nna ressurreição da carne;\nna vida eterna. Amém.",
    tags: ["creio", "fe", "apostolos", "basica", "terço"]
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
    id: "regina-caeli",
    titulo: "Regina Caeli",
    categoria: "Tempos Litúrgicos",
    descricao: "Substitui o Angelus durante o Tempo Pascal",
    texto: "Rainha do céu, alegrai-vos, aleluia.\nPorque aquele que merecestes trazer em vosso seio, aleluia.\nRessuscitou como disse, aleluia.\nRogai a Deus por nós, aleluia.\n\nV. Exultai e alegrai-vos, ó Virgem Maria, aleluia.\nR. Porque o Senhor ressuscitou verdadeiramente, aleluia.\n\nOremos: Ó Deus, que vos dignastes alegrar o mundo com a ressurreição do vosso Filho Jesus Cristo, Senhor Nosso, concedei-nos, vos suplicamos, que por sua Mãe, a Virgem Maria, alcancemos as alegrias da vida eterna. Por Cristo, Senhor Nosso. Amém.",
    tags: ["pascoa", "tempo pascal", "regina", "caeli", "rainha do ceu"]
  },
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
  {
    id: "sao-miguel",
    titulo: "Oração a São Miguel Arcanjo",
    categoria: "Diversas Circunstâncias",
    texto: "São Miguel Arcanjo, defendei-nos no combate;\nSede o nosso refúgio contra as maldades e ciladas do demônio.\nOrdene-lhe Deus, instantemente o pedimos;\ne vós, príncipe da milícia celeste, pelo poder divino,\nprecipitai no inferno a Satanás e a todos os espíritos malignos\nque andam pelo mundo para perder as almas. Amém.",
    tags: ["miguel", "arcanjo", "protecao", "combate"]
  },
  {
    id: "alma-de-cristo",
    titulo: "Alma de Cristo",
    categoria: "Eucarísticas",
    texto: "Alma de Cristo, santificai-me.\nCorpo de Cristo, salvai-me.\nSangue de Cristo, inebriai-me.\nÁgua do lado de Cristo, lavai-me.\nPaixão de Cristo, confortai-me.\nÓ bom Jesus, ouvi-me.\nDentro de vossas chagas, escondei-me.\nNão permitais que me separe de Vós.\nDo espírito maligno defendei-me.\nNa hora da morte chamai-me\ne mandai-me ir para Vós,\npara que com vossos Santos Vos louve\npor todos os séculos dos séculos. Amém.",
    tags: ["alma", "cristo", "comunhao", "eucaristia", "santo inacio"]
  },
  {
    id: "oracao-espirito-santo",
    titulo: "Vinde Espírito Santo",
    categoria: "Diárias",
    texto: "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do Vosso amor.\nEnviai o Vosso Espírito e tudo será criado,\ne renovareis a face da terra.\n\nOremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos da sua consolação. Por Cristo Senhor Nosso. Amém.",
    tags: ["espirito santo", "pentecostes", "vinde"]
  },
  {
    id: "comunhao-espiritual",
    titulo: "Comunhão Espiritual",
    categoria: "Eucarísticas",
    texto: "Meu Jesus, eu creio que estais presente no Santíssimo Sacramento do Altar.\nAmo-Vos sobre todas as coisas e minha alma suspira por Vós.\nMas, como não posso receber-Vos agora no Santíssimo Sacramento,\nvinde, ao menos espiritualmente, ao meu coração.\nAbraço-me convosco como se já estivésseis comigo:\nuno-me Convosco inteiramente.\nAh! não permitais que eu torne a separar-me de Vós! Amém.",
    tags: ["comunhao", "espiritual", "eucaristia", "missa"]
  },
  {
    id: "consagracao-nossa-senhora",
    titulo: "Consagração a Nossa Senhora",
    categoria: "Marianas",
    texto: "Ó minha Senhora e minha Mãe,\neu me ofereço todo(a) a vós,\ne em prova da minha devoção para convosco,\nvos consagro neste dia e para sempre:\nos meus olhos, os meus ouvidos, a minha boca,\no meu coração e inteiramente todo o meu ser.\nE porque assim sou vosso(a), ó incomparável Mãe,\nguardai-me e defendei-me como propriedade e possessão vossa. Amém.",
    tags: ["consagracao", "nossa senhora", "maria"]
  }
];
