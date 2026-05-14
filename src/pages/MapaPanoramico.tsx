import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, CalendarDays, Heart, BookOpen, Flame, Send, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FaseType = {
  titulo: string;
  objetivo: string;
  eixos?: string[];
  passos?: string[];
  metodologia?: string[];
};

type TempoType = {
  titulo: string;
  duracao?: string;
  fases: FaseType[];
  color: string;
  icon: any;
};

const itinerarioData: TempoType[] = [
  {
    titulo: "PREPARAÇÃO",
    duracao: "Duração mínima - 1 mês",
    color: "emerald",
    icon: CalendarDays,
    fases: [
      {
        titulo: "Convite e Acolhida",
        objetivo: "Convidar os adolescentes/jovens para o itinerário de IVC.",
        metodologia: [
          "Envolvimento da comunidade eclesial.",
          "Divulgação do processo da IVC (comunidade eclesial, escolas, centros culturais, esportivos, redes sociais, etc.).",
          "Conscientizar as famílias para o apoio e o acompanhamento dos adolescentes/jovens.",
          "Festa das Inscrições."
        ]
      }
    ]
  },
  {
    titulo: "PRIMEIRO TEMPO: PRÉ-CATECUMENATO",
    duracao: "TEMPO QUERIGMÁTICO (Duração mínima - 3 meses)",
    color: "amber",
    icon: Heart,
    fases: [
      {
        titulo: "A Pessoa de Jesus Cristo",
        objetivo: "Fazer a experiência do encontro com a pessoa e missão de Jesus Cristo.",
        eixos: [
          "Jesus, jovem de Nazaré, comprometido com seu tempo, anuncia o Reino de Deus (Mc 1,35-39).",
          "Jesus, amigo (Jo 15,12-17).",
          "Jesus, \"herói\" libertador (Mc 6,53-56).",
          "Jesus, \"caminho, verdade e vida\" (Jo 14,1-7).",
          "Jesus salva com sua morte e ressurreição (At 3,12-19).",
          "Jesus convida ao seguimento - projeto de vida pessoal e comunitário (Mc 1,16-20; 2,13-14; 3,13-19)."
        ]
      },
      {
        titulo: "CELEBRAÇÃO DE ENTRADA PARA O TEMPO DE CATEQUESE",
        objetivo: "Acolher, na comunidade, os adolescentes/jovens para o aprofundamento da fé.",
        passos: [
          "Reunião fora da Igreja-templo.",
          "Diálogo com a comunidade e adolescentes/jovens.",
          "Ingresso na Igreja-templo.",
          "Proclamação da Palavra.",
          "Recepção da cruz."
        ]
      }
    ]
  },
  {
    titulo: "SEGUNDO TEMPO: CATECUMENATO",
    duracao: "TEMPO DE APROFUNDAMENTO (Duração mínima - 12 meses)",
    color: "blue",
    icon: BookOpen,
    fases: [
      {
        titulo: "PRIMEIRA FASE: Palavra de Deus",
        objetivo: "Proporcionar uma compreensão da Palavra de Deus em vista do amadurecimento da fé.",
        eixos: [
          "Visão geral da Sagrada Escritura.",
          "A Leitura Orante da Bíblia adaptada a adolescentes/jovens."
        ]
      },
      {
        titulo: "CELEBRAÇÃO DA PALAVRA DE DEUS",
        objetivo: "Acolher o dom da Revelação de Deus presente na Sagrada Escritura como luz e caminho.",
        passos: [
          "Entrada solene da Sagrada Escritura.",
          "Proclamação da Palavra.",
          "Entrega da Bíblia aos adolescentes/jovens."
        ]
      },
      {
        titulo: "SEGUNDA FASE: Pessoa Humana",
        objetivo: "Conduzir ao autoconhecimento e busca de identificação como pessoa, a partir da fé cristã, numa sociedade desafiadora.",
        eixos: [
          "Quem sou eu?",
          "Eu e minha história (vocação para vida).",
          "Eu e minha relação com Deus.",
          "Eu e minha relação com os outros.",
          "Eu e minha relação com o ambiente (físico, cultural, geográfico, etc.).",
          "A sexualidade."
        ]
      },
      {
        titulo: "CELEBRAÇÃO DA VIDA",
        objetivo: "Valorizar o dom da vida que se manifesta nas variadas relações humanizantes.",
        metodologia: [
          "Uso de símbolos que remetem à vida.",
          "Dramatização."
        ],
        passos: [
          "Fatos da vida, personagens históricos atuais.",
          "Proclamação da Palavra.",
          "Oração de agradecimento."
        ]
      },
      {
        titulo: "TERCEIRA FASE: Jesus, o Cristo",
        objetivo: "Aprofundar sobre a encarnação, vida, Paixão, Morte, Ressurreição e permanência de Jesus Cristo, mediante a ação do Espírito.",
        eixos: [
          "Jesus, a Palavra encarnada do Pai (Jo 1,1-14).",
          "Jesus Cristo e o reinado de Deus - estilo de vida e ensinamentos (Mt 5-7).",
          "Jesus, o Crucificado (Mc 14-15).",
          "Jesus, o Ressuscitado-Glorificado (Lc 24,36-53).",
          "Jesus Cristo permanece no meio de nós através do Espírito Santo (Jo 16,5-15).",
          "O Espírito nos impulsiona a seguir o Filho para a construção de uma vida melhor (1Cor 2,10-16)."
        ]
      },
      {
        titulo: "JORNADA DO DISCIPULADO",
        objetivo: "Comprometer-se com a Boa-Nova de Jesus Cristo.",
        metodologia: [
          "Dia de Espiritualidade/Retiro.",
          "Festa do discipulado.",
          "Confecção de símbolos de pertença e partilha (camisa, bóton, boné, etc.).",
          "Dramatização."
        ],
        passos: [
          "Celebração de entrega do Mandamento do Amor (Jo 13,34-35).",
          "Oração sobre os adolescentes/jovens."
        ]
      },
      {
        titulo: "QUARTA FASE: A vida de oração",
        objetivo: "Apresentar a comunhão orante de Jesus Cristo com o Pai, no Espírito, como fonte de nossa vida cristã.",
        eixos: [
          "Jesus, movido pelo Espírito Santo, ora e ensina a orar (Lc 10,21-22).",
          "Aprofundamento da oração do Pai-Nosso (Lc 11,1-4).",
          "Vida de oração pessoal e comunitária.",
          "Experiências de oração a partir da Bíblia (leitura orante da Palavra de Deus, ofício divino, adoração eucarística, vigília de oração, caminhadas/romarias, etc.)."
        ]
      },
      {
        titulo: "JORNADA DE ORAÇÃO A PARTIR DO PAI-NOSSO",
        objetivo: "Acolher e viver a relação filial com Deus Pai e a fraternidade com todos os irmãos e irmãs, como modelo da vida cristã.",
        metodologia: [
          "Revisão de vida sobre a importância da Oração do Senhor."
        ],
        passos: [
          "Meditação parte por parte da Oração do Senhor.",
          "Celebração a partir da oração do Senhor."
        ]
      },
      {
        titulo: "QUINTA FASE: Comunidade de Fé, Esperança e Caridade",
        objetivo: "Aprofundar a pertença à Igreja como Povo de Deus, Corpo de Cristo e Templo do Espírito Santo, mediante a profissão madura da fé e sua vivência na comunidade.",
        eixos: [
          "A experiência de Pentecostes (At 2,1-12).",
          "A formação das primeiras comunidades (Mt 1,1-17; Lc 3,23-38).",
          "As raízes do Novo Povo de Deus: Patriarcas; Moisés; Juízes; Reis e profetas (Gn 12,1-9; Gn 21; Ex 2,23-25; 3,1-22; Ex 6,2-8; Ex 19,1-9).",
          "O Povo em Jesus Cristo (Rm 11,25-32).",
          "Creio - nossa fé professada: as três Pessoas divinas.",
          "Creio - nossa fé professada: a Igreja.",
          "Creio - nossa fé professada: as realidades futuras.",
          "Igreja: escola de comunhão e casa da iniciação.",
          "Maria, jovem comprometida com o projeto de Deus (Lc 1-2; Jo 2,12.19,25-27).",
          "Dons e serviços na Igreja e no mundo (apresentação das pastorais e serviços eclesiais) (1Cor 12,1-11)."
        ]
      },
      {
        titulo: "CELEBRAÇÃO DE ENTREGA DO SÍMBOLO DA FÉ",
        objetivo: "Acolher a fé da Igreja como sua.",
        passos: [
          "Proclamação da Palavra.",
          "Profissão do Símbolo da Fé (Creio) diante da comunidade.",
          "Oração sobre os adolescentes/jovens."
        ]
      },
      {
        titulo: "SEXTA FASE: Vida Sacramental",
        objetivo: "Aprofundar a importância da experiência salvífico-sacramental na vida cristã.",
        eixos: [
          "Jesus, Sacramento do encontro com o Pai (Jo 14,8-11).",
          "A Igreja, Sacramento de encontro com Cristo (At 3,1-10).",
          "O Batismo.",
          "A Crisma/Confirmação.",
          "A Eucaristia (Mc 14,22-25).",
          "Os Sacramentos de serviço: Matrimônio e Ordem.",
          "Os Sacramentos de cura: Reconciliação e Unção.",
          "Vivência e compromisso cristão que deriva da experiência sacramental."
        ]
      }
    ]
  },
  {
    titulo: "TERCEIRO TEMPO: ILUMINAÇÃO E PURIFICAÇÃO",
    duracao: "JORNADA DA ELEIÇÃO (Primeiro Domingo da Quaresma)",
    color: "purple",
    icon: Flame,
    fases: [
      {
        titulo: "Celebração e Retiro",
        objetivo: "Aprofundar o dom da missão concedido pelo Espírito de Deus.",
        metodologia: [
          "Retiro sobre a missão da Samaritana e do Cego de nascença."
        ],
        passos: [
          "Proclamação da Palavra.",
          "Testemunho pessoal do adolescente/jovem.",
          "Oração de admissão ao(s) sacramento(s)."
        ]
      }
    ]
  },
  {
    titulo: "QUARTO TEMPO: MISTAGOGIA",
    duracao: "ENVIO MISSIONÁRIO",
    color: "rose",
    icon: Send,
    fases: [
      {
        titulo: "Missão e Testemunho",
        objetivo: "Viver o envio missionário, inserindo-se ativamente na vida comunitária e testemunhando o Evangelho.",
        eixos: [
          "Participação ativa na Eucaristia dominical.",
          "Engajamento em pastorais, movimentos e serviços da comunidade.",
          "O testemunho cristão nos ambientes cotidianos (família, escola, trabalho, redes sociais).",
          "A leitura continuada da Palavra de Deus."
        ],
        passos: [
          "Celebração de Envio Missionário.",
          "Apresentação dos recém-crismados à comunidade.",
          "Entrega de um símbolo missionário (vela, cruz, etc.)."
        ]
      }
    ]
  }
];

export default function MapaPanoramico() {
  const navigate = useNavigate();
  const [expandedTempo, setExpandedTempo] = useState<number | null>(0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center px-12">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Mapa Panorâmico
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Itinerário IVC</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-2 border-black/5 dark:border-white/5 rounded-3xl p-6 text-center shadow-lg shadow-black/5 animate-fade-in stagger-1">
        <Map className="w-12 h-12 text-primary/80 mx-auto mb-4" />
        <h2 className="text-xl font-black text-foreground mb-2">Jornada da Iniciação à Vida Cristã</h2>
        <p className="text-sm text-muted-foreground font-medium">Acompanhe visualmente todo o trajeto que a turma percorre, desde a preparação inicial até o envio missionário. Clique nos Tempos para expandir e ver os detalhes.</p>
      </div>

      {/* Timeline */}
      <div className="relative mt-8 px-2 sm:px-4">
        {/* The central spine */}
        <div className="absolute top-8 bottom-8 left-6 sm:left-12 w-1.5 bg-gradient-to-b from-emerald-500 via-primary to-rose-500 rounded-full opacity-20" />

        <div className="space-y-8">
          {itinerarioData.map((tempo, index) => {
            const Icon = tempo.icon;
            const isExpanded = expandedTempo === index;
            const isBlue = tempo.color === 'blue';
            const isEmerald = tempo.color === 'emerald';
            const isAmber = tempo.color === 'amber';
            const isPurple = tempo.color === 'purple';
            const isRose = tempo.color === 'rose';
            
            const colorClass = isEmerald ? 'text-emerald-600 bg-emerald-100 border-emerald-200' :
                               isAmber ? 'text-amber-600 bg-amber-100 border-amber-200' :
                               isBlue ? 'text-blue-600 bg-blue-100 border-blue-200' :
                               isPurple ? 'text-purple-600 bg-purple-100 border-purple-200' :
                               'text-rose-600 bg-rose-100 border-rose-200';

            const strokeClass = isEmerald ? 'border-emerald-500' :
                                isAmber ? 'border-amber-500' :
                                isBlue ? 'border-blue-500' :
                                isPurple ? 'border-purple-500' :
                                'border-rose-500';

            return (
              <div key={index} className={`relative pl-12 sm:pl-24 animate-in slide-in-from-bottom-4 duration-500`} style={{ animationDelay: `${index * 150}ms` }}>
                
                {/* Node on the spine */}
                <div className={`absolute left-2 sm:left-8 top-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 ${strokeClass} bg-white dark:bg-zinc-950 shadow-md flex items-center justify-center z-10 transition-transform ${isExpanded ? 'scale-125' : 'hover:scale-110'}`}>
                  <div className={`w-3 h-3 rounded-full ${isExpanded ? 'bg-current ' + strokeClass.replace('border-', 'bg-') : 'bg-transparent'}`} />
                </div>

                {/* Tempo Card */}
                <button 
                  onClick={() => setExpandedTempo(isExpanded ? null : index)}
                  className={`w-full text-left bg-white dark:bg-zinc-900 rounded-[2rem] p-5 sm:p-6 shadow-sm border border-black/5 dark:border-white/5 transition-all duration-300 hover:shadow-lg relative overflow-hidden group ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 transition-transform group-hover:scale-150 ${colorClass.split(' ')[1]}`} />
                  
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">{tempo.titulo}</h3>
                      {tempo.duracao && (
                        <p className="text-xs font-bold text-muted-foreground mt-1 tracking-widest uppercase">{tempo.duracao}</p>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Fases (Expanded content) */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                        {tempo.fases.map((fase, fIndex) => (
                          <div key={fIndex} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 sm:p-5 border border-black/5">
                            <h4 className="font-black text-sm text-foreground uppercase tracking-wider mb-2">{fase.titulo}</h4>
                            <p className="text-xs font-medium text-foreground/80 mb-4">{fase.objetivo}</p>
                            
                            <div className="space-y-3">
                              {fase.eixos && (
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/70 mb-1.5 block">Eixos Temáticos</span>
                                  <ul className="space-y-1.5 pl-1">
                                    {fase.eixos.map((eixo, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                        <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                                        <span className="leading-tight">{eixo}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {fase.metodologia && (
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 mb-1.5 block">Indicações Metodológicas</span>
                                  <ul className="space-y-1.5 pl-1">
                                    {fase.metodologia.map((item, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                        <span className="w-1 h-1 rounded-full bg-amber-500/40 shrink-0 mt-1.5" />
                                        <span className="leading-tight">{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {fase.passos && (
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-500/70 mb-1.5 block">Passos da Celebração</span>
                                  <ul className="space-y-1.5 pl-1">
                                    {fase.passos.map((passo, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                        <span className="w-1 h-1 rounded-full bg-purple-500/40 shrink-0 mt-1.5" />
                                        <span className="leading-tight">{passo}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
