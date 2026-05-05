export interface LivroMetadata {
  autor: string;
  epoca: string;
  temaCentral: string;
  dicaCatequese: string;
}

export const historiaBiblia = {
  titulo: "A História da Bíblia Sagrada",
  introducao: "A Bíblia (do grego bíblion, 'rolo' ou 'livro') é a coleção de textos sagrados de valor inestimável para a fé cristã. Não é apenas um livro, mas uma verdadeira biblioteca escrita por diversos autores, em diferentes épocas e lugares, sob a inspiração do Espírito Santo.",
  topicos: [
    {
      titulo: "1. Como a Bíblia surgiu?",
      conteudo: "Muito antes de ser escrita, a Palavra de Deus era transmitida oralmente de geração em geração. Os patriarcas contavam aos seus filhos as maravilhas que Deus havia feito. Somente séculos depois, por volta do ano 1000 a.C. a 50 d.C., esses relatos começaram a ser registrados em papiro e pergaminho."
    },
    {
      titulo: "2. Os Idiomas Originais",
      conteudo: "O Antigo Testamento foi escrito predominantemente em Hebraico, com algumas partes em Aramaico e Grego. Já o Novo Testamento foi escrito integralmente em Grego Koiné, a língua popular da época, facilitando a expansão do Evangelho por todo o Império Romano."
    },
    {
      titulo: "3. A Vulgata e a Tradução",
      conteudo: "No final do século IV, o Papa Dâmaso I encomendou a São Jerônimo a tradução de toda a Bíblia para o Latim, a língua comum do império. Essa tradução ficou conhecida como 'Vulgata' (de vulgus, povo) e foi a base para a Igreja Católica por mais de mil anos. A famosa frase de São Jerônimo é: 'Ignorar as Escrituras é ignorar o próprio Cristo'."
    },
    {
      titulo: "4. O Cânon Católico (73 Livros)",
      conteudo: "A Bíblia Católica é composta por 73 livros: 46 no Antigo Testamento e 27 no Novo Testamento. Diferente de outras traduções, ela inclui os chamados livros 'Deuterocanônicos' (Tobias, Judite, Sabedoria, Eclesiástico, Baruc, 1 e 2 Macabeus, além de trechos de Ester e Daniel), que sempre foram utilizados pelos primeiros cristãos e pela Igreja ao longo dos séculos."
    },
    {
      titulo: "5. A Invenção da Imprensa",
      conteudo: "A Bíblia foi o primeiro livro de grande escala impresso no mundo. Em 1455, Johannes Gutenberg imprimiu a Bíblia em latim usando a prensa de tipos móveis. Isso revolucionou a história humana e permitiu que a Palavra de Deus chegasse a muito mais pessoas."
    }
  ]
};

// Dicionário mapeando o nome do livro (em minúsculo ou chave exata) para seus metadados.
// Como há muitos livros, incluímos os mais acessados na catequese e uma chave default.
export const livrosMetadata: Record<string, LivroMetadata> = {
  "gênesis": {
    autor: "Tradição atribuída a Moisés",
    epoca: "Sec. XV - V a.C.",
    temaCentral: "As origens do mundo, da humanidade e do povo de Deus.",
    dicaCatequese: "Foque na criação como ato de amor de Deus e nas histórias dos Patriarcas (Abraão, Isaac, Jacó) como modelos de fé."
  },
  "êxodo": {
    autor: "Tradição atribuída a Moisés",
    epoca: "Sec. XV - V a.C.",
    temaCentral: "A libertação do povo de Israel do Egito e a Aliança no Sinai.",
    dicaCatequese: "Ensine sobre os 10 Mandamentos como guias de amor, e a passagem do Mar Vermelho como prefiguração do Batismo."
  },
  "salmos": {
    autor: "Davi, Asafe, filhos de Coré, entre outros",
    epoca: "Sec. X - V a.C.",
    temaCentral: "Orações, louvores, lamentos e ações de graça do povo.",
    dicaCatequese: "Use os Salmos para ensinar as crianças a orar. O Salmo 23 é excelente para falar sobre o cuidado de Deus (O Bom Pastor)."
  },
  "isaías": {
    autor: "Profeta Isaías e seus discípulos",
    epoca: "Sec. VIII - VI a.C.",
    temaCentral: "Apelos à conversão e as grandes profecias sobre a vinda do Messias.",
    dicaCatequese: "Muito útil no Advento, para mostrar como Deus já anunciava a chegada do Salvador (O Emanuel)."
  },
  "mateus": {
    autor: "São Mateus, o publicano (Apóstolo)",
    epoca: "Aprox. 70-80 d.C.",
    temaCentral: "Jesus como o Messias prometido do Antigo Testamento, o Novo Moisés.",
    dicaCatequese: "Ótimo para apresentar as Bem-Aventuranças e o Sermão da Montanha como a 'regra de ouro' do cristão."
  },
  "marcos": {
    autor: "São Marcos (discípulo de Pedro)",
    epoca: "Aprox. 60-70 d.C.",
    temaCentral: "Jesus é o Filho de Deus que sofre, o Servo Sofredor.",
    dicaCatequese: "É o Evangelho mais curto e dinâmico. Ideal para mostrar às crianças as ações concretas e milagres de Jesus."
  },
  "lucas": {
    autor: "São Lucas (médico e companheiro de Paulo)",
    epoca: "Aprox. 80-90 d.C.",
    temaCentral: "A misericórdia universal de Deus, os pobres e as mulheres.",
    dicaCatequese: "Rico em parábolas exclusivas como o Filho Pródigo e o Bom Samaritano. Perfeito para falar sobre o perdão e caridade."
  },
  "joão": {
    autor: "São João, o discípulo amado",
    epoca: "Aprox. 90-100 d.C.",
    temaCentral: "Jesus é o Verbo encarnado, a Luz do Mundo, a Vida Eterna.",
    dicaCatequese: "Use as expressões 'Eu sou' (a videira, o caminho, o pão da vida) para ajudar na intimidade profunda com Jesus."
  },
  "atos dos apóstolos": {
    autor: "São Lucas",
    epoca: "Aprox. 80-90 d.C.",
    temaCentral: "A vinda do Espírito Santo (Pentecostes) e o início da Igreja.",
    dicaCatequese: "Essencial para encontros sobre a Igreja, Sacramentos e o Sacramento da Crisma."
  },
  "romanos": {
    autor: "São Paulo",
    epoca: "Aprox. 57-58 d.C.",
    temaCentral: "A justificação pela fé em Jesus Cristo e a vida no Espírito.",
    dicaCatequese: "Explique como o amor de Deus foi derramado em nossos corações, independentemente dos nossos erros passados."
  },
  "apocalipse": {
    autor: "São João",
    epoca: "Aprox. 95 d.C.",
    temaCentral: "A vitória final de Cristo e da Igreja sobre o mal.",
    dicaCatequese: "Desmistifique o livro: não é sobre 'fim do mundo', mas uma mensagem de esperança de que Jesus venceu e sempre estará conosco."
  },
  // Default fallback
  "default": {
    autor: "Diversos autores inspirados por Deus",
    epoca: "Aprox. 1000 a.C. - 100 d.C.",
    temaCentral: "A história da salvação e o amor de Deus pela humanidade.",
    dicaCatequese: "Leia cada passagem buscando entender o que Deus quer falar ao coração da turma hoje."
  }
};

export const getLivroMetadata = (nomeLivro: string): LivroMetadata => {
  const chave = nomeLivro.toLowerCase().trim();
  // Busca exata ou fallback
  return livrosMetadata[chave] || livrosMetadata["default"];
};
