import { ArrowLeft, ChevronLeft, ChevronRight, Star, Sun, Cross, Heart, Flame, Church, Maximize2, Minimize2, Cake, StickyNote, Plus, Trash2, Save, X, BookOpen, Lightbulb, Users, ChevronRight as ChevronRightIcon, Scroll } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useCatequizandos, useCatequistas, useCalendarioNotas, useCalendarioNotaMutation, useDeleteCalendarioNota, useEncontros, useAtividades, useTurmas, useReunioes } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatarDataVigente } from "@/lib/utils";

type EventType = 'solenidade' | 'festa' | 'memoria' | 'tempo' | 'comemorativa';

interface LiturgicalEvent {
  day: number;
  month: number;
  name: string;
  type: EventType;
  color?: 'verde' | 'branco' | 'vermelho' | 'roxo' | 'rosa';
  movable?: boolean;
}

const TYPE_CONFIG: Record<EventType, { label: string; dot: string; icon: typeof Star }> = {
  solenidade: { label: "Solenidade", dot: "bg-primary", icon: Star },
  festa: { label: "Festa", dot: "bg-orange-500", icon: Sun },
  memoria: { label: "Memória", dot: "bg-emerald-500", icon: Heart },
  tempo: { label: "Tempo Litúrgico", dot: "bg-purple-500", icon: Flame },
  comemorativa: { label: "Comemorativa", dot: "bg-blue-500", icon: Cross },
};

const COLOR_MAP: Record<string, string> = {
  verde: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50",
  branco: "bg-amber-50/50 text-amber-700 dark:text-amber-200 border-amber-200/50",
  vermelho: "bg-red-600/10 text-red-700 dark:text-red-400 border-red-200/50",
  roxo: "bg-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-200/50",
  rosa: "bg-pink-600/10 text-pink-700 dark:text-pink-400 border-pink-200/50",
};

const EVENTS: LiturgicalEvent[] = [
  // Janeiro
  { day: 1, month: 1, name: "Santa Maria, Mãe de Deus", type: "solenidade", color: 'branco' },
  { day: 6, month: 1, name: "Epifania do Senhor", type: "solenidade", color: 'branco' },
  { day: 20, month: 1, name: "São Sebastião", type: "memoria", color: 'vermelho' },
  { day: 25, month: 1, name: "Conversão de São Paulo", type: "festa", color: 'branco' },
  { day: 28, month: 1, name: "São Tomás de Aquino", type: "memoria", color: 'branco' },
  { day: 31, month: 1, name: "São João Bosco", type: "memoria", color: 'branco' },
  // Fevereiro
  { day: 2, month: 2, name: "Apresentação do Senhor", type: "festa", color: 'branco' },
  { day: 11, month: 2, name: "Nossa Senhora de Lourdes", type: "memoria", color: 'branco' },
  { day: 14, month: 2, name: "Santos Cirilo e Metódio", type: "memoria", color: 'branco' },
  { day: 18, month: 2, name: "Quarta-feira de Cinzas", type: "tempo", color: 'roxo', movable: true },
  { day: 22, month: 2, name: "Cátedra de São Pedro", type: "festa", color: 'branco' },
  // Março
  { day: 19, month: 3, name: "São José", type: "solenidade", color: 'branco' },
  { day: 25, month: 3, name: "Anunciação do Senhor", type: "solenidade", color: 'branco' },
  { day: 29, month: 3, name: "Domingo de Ramos", type: "solenidade", color: 'vermelho', movable: true },
  // Abril
  { day: 2, month: 4, name: "Quinta-feira Santa", type: "solenidade", color: 'branco', movable: true },
  { day: 3, month: 4, name: "Sexta-feira Santa", type: "solenidade", color: 'vermelho', movable: true },
  { day: 5, month: 4, name: "Páscoa da Ressurreição", type: "solenidade", color: 'branco', movable: true },
  { day: 23, month: 4, name: "São Jorge", type: "memoria", color: 'vermelho' },
  { day: 25, month: 4, name: "São Marcos Evangelista", type: "festa", color: 'vermelho' },
  // Outubro
  { day: 12, month: 10, name: "Nossa Senhora Aparecida", type: "solenidade", color: 'branco' },
  { day: 25, month: 12, name: "Natal do Senhor", type: "solenidade", color: 'branco' },
];

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

// Liturgia Diária: citações bíblicas por dia do mês
const DAILY_LITURGY: Record<string, { citacao: string; referencia: string; tema?: string }> = {
  // Janeiro
  "1-1":  { citacao: "O Senhor te abençoe e te guarde.", referencia: "Nm 6,24", tema: "Benção do Ano Novo" },
  "1-2":  { citacao: "O Senhor é meu pastor e nada me faltará.", referencia: "Sl 22,1", tema: "Confiança em Deus" },
  "1-3":  { citacao: "Buscai o Senhor enquanto ele se dá a achar.", referencia: "Is 55,6", tema: "Busca de Deus" },
  "1-4":  { citacao: "O amor de Deus foi derramado em nossos corações pelo Espírito Santo.", referencia: "Rm 5,5" },
  "1-5":  { citacao: "A palavra de Deus é viva, eficaz e mais afiada do que qualquer espada.", referencia: "Hb 4,12" },
  "1-6":  { citacao: "Todas as nações virão e se prostrarão diante de ti.", referencia: "Sl 86,9", tema: "Epifania" },
  "1-7":  { citacao: "Vem, Senhor Jesus!", referencia: "Ap 22,20" },
  "1-8":  { citacao: "Sede sempre alegres no Senhor.", referencia: "Fl 4,4" },
  "1-9":  { citacao: "O Senhor é minha luz e minha salvação; a quem temerei?", referencia: "Sl 27,1" },
  "1-10": { citacao: "Ao Senhor, vosso Deus, adorareis, e somente a ele servireis.", referencia: "Mt 4,10" },
  "1-11": { citacao: "Este é o meu Filho amado, em quem pus minha satisção.", referencia: "Mt 3,17" },
  "1-12": { citacao: "Não temas, porque eu sou contigo.", referencia: "Is 41,10" },
  "1-13": { citacao: "Amai-vos uns aos outros como eu vos amei.", referencia: "Jo 15,12" },
  "1-14": { citacao: "O Senhor tem compaixão de todos os que o temem.", referencia: "Sl 103,13" },
  "1-15": { citacao: "Sede santos, porque eu sou santo.", referencia: "1Pd 1,16" },
  "1-16": { citacao: "Em tudo dai graças, porque esta é a vontade de Deus.", referencia: "1Ts 5,18" },
  "1-17": { citacao: "Não fui eu quem te ordenei? Sê forte e corajoso.", referencia: "Js 1,9" },
  "1-18": { citacao: "Orai uns pelos outros para serdes curados.", referencia: "Tg 5,16" },
  "1-19": { citacao: "Deus é amor, e quem permanece no amor permanece em Deus.", referencia: "1Jo 4,16" },
  "1-20": { citacao: "Sede fortes na fé e resistí ao diabo.", referencia: "1Pd 5,9", tema: "S. Sebastião" },
  "1-21": { citacao: "Bem-aventurados os puros de coração, porque verão a Deus.", referencia: "Mt 5,8" },
  "1-22": { citacao: "O Senhor é justo em todos os seus caminhos.", referencia: "Sl 145,17" },
  "1-23": { citacao: "Que vosso amor seja sem fingimento.", referencia: "Rm 12,9" },
  "1-24": { citacao: "Toda Escritura é inspirada por Deus e útil para o ensino.", referencia: "2Tm 3,16" },
  "1-25": { citacao: "Quem encontrou a sabedoria encontrou o bem.", referencia: "Pr 8,35", tema: "Conversão de S. Paulo" },
  "1-26": { citacao: "A palavra de Deus é a verdade.", referencia: "Jo 17,17" },
  "1-27": { citacao: "Façamos o bem sem nos cansarmos.", referencia: "Gl 6,9" },
  "1-28": { citacao: "O temor do Senhor é o princípio da sabedoria.", referencia: "Pr 9,10", tema: "S. Tomás de Aquino" },
  "1-29": { citacao: "Confiai sempre nele; derramai perante ele o vosso coração.", referencia: "Sl 62,9" },
  "1-30": { citacao: "Perseverai na oração, velando nela com ação de graças.", referencia: "Cl 4,2" },
  "1-31": { citacao: "Tornai-vos imitádores de Deus como filhos amados.", referencia: "Ef 5,1", tema: "S. João Bosco" },
  // Fevereiro
  "2-1":  { citacao: "O Senhor é meu refugio e minha fortaleza.", referencia: "Sl 91,2" },
  "2-2":  { citacao: "Meus olhos viram a vossa salvação preparada diante de todos os povos.", referencia: "Lc 2,30-31", tema: "Apresentação do Senhor" },
  "2-3":  { citacao: "Serei para vós como pai, e vós sereis para mim filhos e filhas.", referencia: "2Cor 6,18" },
  "2-4":  { citacao: "Amarás o Senhor teu Deus com todo teu coração.", referencia: "Mt 22,37" },
  "2-5":  { citacao: "O Senhor é a minha salvação; não terei medo.", referencia: "Is 12,2" },
  "2-6":  { citacao: "Todos passaram pelo mesmo mar e foram batizados em Moisés.", referencia: "1Cor 10,2" },
  "2-7":  { citacao: "Procurai a paz com todos e a santificação.", referencia: "Hb 12,14" },
  "2-8":  { citacao: "O Senhor reina para sempre, o teu Deus, ó Sião, de geração em geração.", referencia: "Sl 146,10" },
  "2-9":  { citacao: "Sede sóbrios e vigilantes; o diabo anda em derredor como leão.", referencia: "1Pd 5,8" },
  "2-10": { citacao: "Vos darei um coração novo e porei em vós um espírito novo.", referencia: "Ez 36,26" },
  "2-11": { citacao: "Sou a serva do Senhor; faça-se em mim segundo a tua palavra.", referencia: "Lc 1,38", tema: "N. Sra. de Lourdes" },
  "2-12": { citacao: "Sede misericordiosos como vosso Pai é misericordioso.", referencia: "Lc 6,36" },
  "2-13": { citacao: "O Senhor sustenta os que estão prestes a cair.", referencia: "Sl 145,14" },
  "2-14": { citacao: "Ide pelo mundo inteiro e pregai o Evangelho.", referencia: "Mc 16,15", tema: "Ss. Cirilo e Metódio" },
  "2-15": { citacao: "Quem perseverar até o fim será salvo.", referencia: "Mt 24,13" },
  "2-16": { citacao: "O Senhor está perto de todos os que o invocam.", referencia: "Sl 145,18" },
  "2-17": { citacao: "Convertei-vos e crede no Evangelho.", referencia: "Mc 1,15" },
  "2-18": { citacao: "Lembrai-vos de que sois pó e ao pó voltareis.", referencia: "Gn 3,19", tema: "Quarta-feira de Cinzas" },
  "2-19": { citacao: "Criai em mim, ó Deus, um coração puro.", referencia: "Sl 51,12" },
  "2-20": { citacao: "Bem-aventurados os misericordiosos, porque alcançarão misericórdia.", referencia: "Mt 5,7" },
  "2-21": { citacao: "O jejum que escolho não é este: soltar os laços da injustiça?", referencia: "Is 58,6" },
  "2-22": { citacao: "Tu és Pedro e sobre esta pedra edificarei minha Igreja.", referencia: "Mt 16,18", tema: "Cátedra de S. Pedro" },
  "2-23": { citacao: "Vós sois a luz do mundo; não se esconde uma cidade no cimo de um monte.", referencia: "Mt 5,14" },
  "2-24": { citacao: "A misericórdia do Senhor é eterna para os que o temem.", referencia: "Sl 103,17" },
  "2-25": { citacao: "Aquele que semeia em bênçãos também colherá em bênçãos.", referencia: "2Cor 9,6" },
  "2-26": { citacao: "Se alguém quer vir após mim, renegue-se a si mesmo.", referencia: "Mc 8,34" },
  "2-27": { citacao: "Procurai primeiro o Reino de Deus e a sua justiça.", referencia: "Mt 6,33" },
  "2-28": { citacao: "O Senhor é fiel em todas as suas palavras.", referencia: "Sl 145,13" },
  "2-29": { citacao: "Com Deus todas as coisas são possíveis.", referencia: "Mt 19,26" },
  // Março
  "3-1":  { citacao: "Convertei-vos a mim de todo o coração, com jejum, com pranto e com lamento.", referencia: "Jl 2,12" },
  "3-2":  { citacao: "Dai esmola segundo os vossos meios.", referencia: "Tb 4,8" },
  "3-3":  { citacao: "Não se apague no teu coração a lâmpada da fé.", referencia: "cf. Mt 25,8" },
  "3-4":  { citacao: "Sede pacientes, pois o Senhor é compassivo e misericordioso.", referencia: "Tg 5,11" },
  "3-5":  { citacao: "Só em Deus tem paz minha alma.", referencia: "Sl 62,6" },
  "3-6":  { citacao: "Esforçai-vos por entrar pela porta estreita.", referencia: "Lc 13,24" },
  "3-7":  { citacao: "Honra teu pai e tua mãe.", referencia: "Ex 20,12" },
  "3-8":  { citacao: "O Senhor é compassivo e misericordioso, lento para a ira e abundante em graça.", referencia: "Sl 103,8" },
  "3-9":  { citacao: "Sede misericordiosos como o Pai é misericordioso.", referencia: "Lc 6,36" },
  "3-10": { citacao: "Qual o homem que deseja a vida e quer ver dias de felicidade? Guarda tua língua do mal.", referencia: "Sl 34,13-14" },
  "3-11": { citacao: "Não vim revogar a Lei, mas dar-lhe pleno cumprimento.", referencia: "Mt 5,17" },
  "3-12": { citacao: "Voltai ao Senhor com todo o vosso coração.", referencia: "Jl 2,12" },
  "3-13": { citacao: "Ide e não peques mais.", referencia: "Jo 8,11" },
  "3-14": { citacao: "Assim amou Deus o mundo que lhe deu o seu Filho unigênito.", referencia: "Jo 3,16" },
  "3-15": { citacao: "Aquele que beber da água que eu lhe der, nunca mais terá sede.", referencia: "Jo 4,14" },
  "3-16": { citacao: "O Senhor é minha força e meu escudo; nele confiou meu coração.", referencia: "Sl 28,7" },
  "3-17": { citacao: "Amai os vossos inimigos e orai pelos que vos perseguem.", referencia: "Mt 5,44" },
  "3-18": { citacao: "Aprende a discernir o bem do mal e o Senhor te guiará.", referencia: "cf. Is 7,15" },
  "3-19": { citacao: "José, filho de Davi, não temas receber Maria como tua esposa.", referencia: "Mt 1,20", tema: "S. José" },
  "3-20": { citacao: "Eu sou a ressurreição e a vida; quem crê em mim, mesmo que morra, viverá.", referencia: "Jo 11,25" },
  "3-21": { citacao: "Não te orgulhes, porque o Senhor é quem dá a força.", referencia: "cf. Jr 9,23" },
  "3-22": { citacao: "Guardai meus mandamentos e vivereis.", referencia: "Pr 7,2" },
  "3-23": { citacao: "Com amor eterno te amei; por isso te tenho mantido fiel.", referencia: "Jr 31,3" },
  "3-24": { citacao: "Eis que estou à porta e bato.", referencia: "Ap 3,20" },
  "3-25": { citacao: "Eis a serva do Senhor; faça-se em mim segundo a tua palavra.", referencia: "Lc 1,38", tema: "Anunciação" },
  "3-26": { citacao: "Lazaro, vem para fora!", referencia: "Jo 11,43" },
  "3-27": { citacao: "O pão que eu der é a minha carne para a vida do mundo.", referencia: "Jo 6,51" },
  "3-28": { citacao: "A pedra que os construtores rejeitaram tornou-se a pedra angular.", referencia: "Sl 118,22" },
  "3-29": { citacao: "Hosana ao filho de Davi! Bendito o que vem em nome do Senhor!", referencia: "Mt 21,9", tema: "Domingo de Ramos" },
  "3-30": { citacao: "O Senhor Deus abriu-me os ouvidos e eu não resisti.", referencia: "Is 50,5" },
  "3-31": { citacao: "Examina-me, ó Deus, e conhece o meu coração.", referencia: "Sl 139,23" },
  // Abril
  "4-1":  { citacao: "Eis o Cordeiro de Deus, que tira o pecado do mundo.", referencia: "Jo 1,29" },
  "4-2":  { citacao: "O Filho do Homem foi entregue às mãos dos pecadores.", referencia: "Mc 14,41", tema: "Quinta-feira Santa" },
  "4-3":  { citacao: "Em verdade ele tomou as nossas enfermidades e carregou as nossas dores.", referencia: "Is 53,4", tema: "Sexta-feira Santa" },
  "4-4":  { citacao: "Meu Deus, meu Deus, por que me abandonaste?", referencia: "Sl 22,2" },
  "4-5":  { citacao: "Aleluia! Cristo ressuscitou! Ele é verdadeiramente o Senhor!", referencia: "cf. Lc 24,34", tema: "Páscoa" },
  "4-6":  { citacao: "Se fostes ressuscitados com Cristo, buscai as coisas do alto.", referencia: "Cl 3,1" },
  "4-7":  { citacao: "Alleluia! O Senhor rege para sempre.", referencia: "Sl 146,10" },
  "4-8":  { citacao: "Não é aqui; ressuscitou.", referencia: "Mc 16,6" },
  "4-9":  { citacao: "Jesus apareceu primeiro a Maria Madalena.", referencia: "Mc 16,9" },
  "4-10": { citacao: "A paz esteja convosco!", referencia: "Jo 20,19" },
  "4-11": { citacao: "Meu Senhor e meu Deus!", referencia: "Jo 20,28" },
  "4-12": { citacao: "Nós somos testemunhas de todas as coisas que Jesus fez.", referencia: "At 10,39" },
  "4-13": { citacao: "Cristo morreu pelos nossos pecados segundo as Escrituras.", referencia: "1Cor 15,3" },
  "4-14": { citacao: "Sede sempre prontos a dar a razão da vossa esperança.", referencia: "1Pd 3,15" },
  "4-15": { citacao: "Eu sou o Bom Pastor; conheço as minhas ovelhas.", referencia: "Jo 10,14" },
  "4-16": { citacao: "Eu vim para que tenham vida e a tenham em abundância.", referencia: "Jo 10,10" },
  "4-17": { citacao: "Permanecei em mim, e eu em vós.", referencia: "Jo 15,4" },
  "4-18": { citacao: "Sou a videira verdadeira e meu Pai é o agricultor.", referencia: "Jo 15,1" },
  "4-19": { citacao: "Não sois do mundo, mas eu vos escolhi dentre o mundo.", referencia: "Jo 15,19" },
  "4-20": { citacao: "O Espírito Santo que o Pai enviará em meu nome vos ensinará tudo.", referencia: "Jo 14,26" },
  "4-21": { citacao: "Vou preparar-vos um lugar.", referencia: "Jo 14,2" },
  "4-22": { citacao: "Eu sou o caminho, a verdade e a vida.", referencia: "Jo 14,6" },
  "4-23": { citacao: "Sede fortes na fé e enfrentai o maligno.", referencia: "cf. 1Pd 5,9", tema: "S. Jorge" },
  "4-24": { citacao: "Deus, que começou em vós esta boa obra, vai completá-la.", referencia: "Fl 1,6" },
  "4-25": { citacao: "Ide pelo mundo inteiro e proclamai o Evangelho.", referencia: "Mc 16,15", tema: "S. Marcos" },
  "4-26": { citacao: "Rogo que sejais um, como nós somos um.", referencia: "Jo 17,11" },
  "4-27": { citacao: "Aquele que crê em mim, mesmo que morra, viverá.", referencia: "Jo 11,25" },
  "4-28": { citacao: "O amor de Deus foi derramado em nossos corações pelo Espírito Santo.", referencia: "Rm 5,5" },
  "4-29": { citacao: "Toda a autoridade me foi dada no céu e na terra.", referencia: "Mt 28,18" },
  "4-30": { citacao: "Eis que estou convosco todos os dias até a consumação dos séculos.", referencia: "Mt 28,20" },
  // Maio
  "5-1":  { citacao: "Tudo o que fizerdes, fazei-o de coração como para o Senhor.", referencia: "Cl 3,23" },
  "5-2":  { citacao: "Aquele que quiser ser o maior entre vós, que seja o vosso servo.", referencia: "Mt 23,11" },
  "5-3":  { citacao: "Quem me viu, viu o Pai.", referencia: "Jo 14,9" },
  "5-4":  { citacao: "A paz que o mundo não pode dar, eu vos dou.", referencia: "cf. Jo 14,27" },
  "5-5":  { citacao: "Quando o Espírito da Verdade vier, ele vos guiará em toda a verdade.", referencia: "Jo 16,13" },
  "5-6":  { citacao: "Rogai ao Senhor da messe que mande operários para a sua messe.", referencia: "Lc 10,2" },
  "5-7":  { citacao: "Glorificai a Deus no vosso corpo.", referencia: "1Cor 6,20" },
  "5-8":  { citacao: "Bem-aventurados os pobres em espírito, porque deles é o reino dos céus.", referencia: "Mt 5,3" },
  "5-9":  { citacao: "Louvai o Senhor com toda a sua criação.", referencia: "cf. Sl 150" },
  "5-10": { citacao: "Mãe, aí tendes o vosso filho. Filho, aí tendes a vossa mãe.", referencia: "Jo 19,26-27" },
  "5-11": { citacao: "Nada vos separa do amor de Deus em Cristo Jesus.", referencia: "Rm 8,39" },
  "5-12": { citacao: "Não deixes de fazer o bem.", referencia: "Pr 3,27" },
  "5-13": { citacao: "A Mãe de Jesus foi lá convidada.", referencia: "Jo 2,1", tema: "N. Sra. de Fátima" },
  "5-14": { citacao: "Não vos deixarei órfãos; virei a vós.", referencia: "Jo 14,18" },
  "5-15": { citacao: "Aprende de mim, que sou manso e humilde de coração.", referencia: "Mt 11,29" },
  "5-16": { citacao: "Senhor, mostra-nos o Pai e isso nos basta.", referencia: "Jo 14,8" },
  "5-17": { citacao: "O amor paciente e benévolo, o amor não é ciumento.", referencia: "1Cor 13,4" },
  "5-18": { citacao: "Chamai-me, e vos responderei.", referencia: "Jr 33,3" },
  "5-19": { citacao: "Quanto mais orardes, mais vos darei.", referencia: "cf. Lc 11,9" },
  "5-20": { citacao: "Pai, glorifica o teu Filho, para que o Filho te glorifique.", referencia: "Jo 17,1" },
  "5-21": { citacao: "Ascendeu ao céu e está sentado à direita do Pai.", referencia: "Credo Niceno-Constantinopolitano", tema: "Ascensão" },
  "5-22": { citacao: "Sede sábios como as serpentes e simples como as pombas.", referencia: "Mt 10,16" },
  "5-23": { citacao: "Hoje, se ouvirdes a voz do Senhor, não endureçais o coração.", referencia: "Sl 95,7-8" },
  "5-24": { citacao: "Reunidos com Maria, perseveravam unanimemente na oração.", referencia: "At 1,14" },
  "5-25": { citacao: "Esperai em Deus, pois ainda o louvarei.", referencia: "Sl 43,5" },
  "5-26": { citacao: "Quando vier o Espírito Santo, sereis minhas testemunhas.", referencia: "At 1,8" },
  "5-27": { citacao: "Sede cheios do Espírito Santo.", referencia: "Ef 5,18", tema: "Pentécostes" },
  "5-28": { citacao: "O Espírito dá vida; a carne não aproveita nada.", referencia: "Jo 6,63" },
  "5-29": { citacao: "Dai, e ser-vos-á dado.", referencia: "Lc 6,38" },
  "5-30": { citacao: "Vinde, benditos de meu Pai, sede herdeiros do reino.", referencia: "Mt 25,34" },
  "5-31": { citacao: "E a Palavra se fez carne e habitou entre nós.", referencia: "Jo 1,14", tema: "Visitação de Maria" },
  // Junho
  "6-1":  { citacao: "Vinde a mim todos os que estais fatigados e sobrecarregados, e eu vos aliviarei.", referencia: "Mt 11,28" },
  "6-2":  { citacao: "Permanecei no meu amor.", referencia: "Jo 15,9" },
  "6-3":  { citacao: "Quem guardar a sua palavra, o amor de Deus está nele perfeitamente consumado.", referencia: "1Jo 2,5" },
  "6-4":  { citacao: "Vós sois amigos meus se fizerdes o que vos mando.", referencia: "Jo 15,14" },
  "6-5":  { citacao: "Não sejais vencidos pelo mal, mas vencei o mal com o bem.", referencia: "Rm 12,21" },
  "6-6":  { citacao: "Sede humildes e obedientes uns com os outros.", referencia: "cf. 1Pd 5,5" },
  "6-7":  { citacao: "O fruto do Espírito é amor, alegria, paz, longanimidade...", referencia: "Gl 5,22" },
  "6-8":  { citacao: "Não pode o servo ser maior que o seu senhor.", referencia: "Jo 13,16" },
  "6-9":  { citacao: "Quem me ama guardará a minha palavra.", referencia: "Jo 14,23" },
  "6-10": { citacao: "O Senhor nunca abandona os que confiam nele.", referencia: "Sl 9,11" },
  "6-11": { citacao: "Ide, fazei discípulos de todas as nações.", referencia: "Mt 28,19" },
  "6-12": { citacao: "O coração de Jesus é manancial de graça e misericórdia.", referencia: "cf. Jo 7,37" },
  "6-13": { citacao: "Tiveste fé, tiveste amor, busca a santidade.", referencia: "cf. 1Tm 6,11" },
  "6-14": { citacao: "Sois o corpo de Cristo e membros uns dos outros.", referencia: "1Cor 12,27" },
  "6-15": { citacao: "Façamos o bem, pois no tempo próprio colheremos.", referencia: "Gl 6,9" },
  "6-16": { citacao: "Sede perfeitos como o vosso Pai celestial é perfeito.", referencia: "Mt 5,48" },
  "6-17": { citacao: "O amor é a plenitude da lei.", referencia: "Rm 13,10" },
  "6-18": { citacao: "Onde estiver o teu tesouro, aí estará também o teu coração.", referencia: "Mt 6,21" },
  "6-19": { citacao: "Eis o Coração que tanto amou os homens.", referencia: "cf. Jo 19,34", tema: "Sagrado Coração de Jesus" },
  "6-20": { citacao: "Dai glória ao Senhor, porque ele é bom.", referencia: "Sl 136,1" },
  "6-21": { citacao: "Deus faz habituar o solitário em família.", referencia: "Sl 68,7" },
  "6-22": { citacao: "Deus é fiel: não vos deixará tentar além das vossas forças.", referencia: "1Cor 10,13" },
  "6-23": { citacao: "Preparai o caminho do Senhor; endireitai as suas veredas.", referencia: "Mc 1,3" },
  "6-24": { citacao: "Houve um homem enviado por Deus, chamado João.", referencia: "Jo 1,6", tema: "Natividade de S. João Batista" },
  "6-25": { citacao: "Ouvistes que foi dito... Mas eu vos digo.", referencia: "Mt 5,27-28" },
  "6-26": { citacao: "O fruto da justiça se semeia na paz para os que praticam a paz.", referencia: "Tg 3,18" },
  "6-27": { citacao: "O Senhor é meu pastor; nada me falta.", referencia: "Sl 23,1" },
  "6-28": { citacao: "Os santos que precederam pregaram o Evangelho do reino.", referencia: "cf. Mt 4,23" },
  "6-29": { citacao: "Tu és Pedro, e sobre esta pedra edificarei minha Igreja.", referencia: "Mt 16,18", tema: "Ss. Pedro e Paulo" },
  "6-30": { citacao: "Acautelai-vos contra os falsos profetas.", referencia: "Mt 7,15" },
  // Julho
  "7-1":  { citacao: "O Senhor guarda os pés dos seus fiéis.", referencia: "1Sm 2,9" },
  "7-2":  { citacao: "Por que procurais o Vivo entre os mortos?", referencia: "Lc 24,5" },
  "7-3":  { citacao: "Meu Senhor e meu Deus!", referencia: "Jo 20,28", tema: "S. Tomás Apóstolo" },
  "7-4":  { citacao: "Quem diz que permanece em Cristo deve andar como ele andou.", referencia: "1Jo 2,6" },
  "7-5":  { citacao: "Vós que credes em Deus, crede também em mim.", referencia: "Jo 14,1" },
  "7-6":  { citacao: "O amor de Deus é eterno para sempre.", referencia: "Sl 118,29" },
  "7-7":  { citacao: "Deixai as crianças virem a mim.", referencia: "Mt 19,14" },
  "7-8":  { citacao: "Servi ao Senhor com alegria.", referencia: "Sl 100,2" },
  "7-9":  { citacao: "Ide aprender o que significa: quero misericórdia, não sacrifícios.", referencia: "Mt 9,13" },
  "7-10": { citacao: "Nada pode separar-nos do amor de Deus.", referencia: "Rm 8,39" },
  "7-11": { citacao: "Vinde e segui-me.", referencia: "Mt 19,21" },
  "7-12": { citacao: "O que a mão esquerda faz não saiba a mão direita.", referencia: "Mt 6,3" },
  "7-13": { citacao: "Eu sou a ressurreição e a vida.", referencia: "Jo 11,25" },
  "7-14": { citacao: "O manso herdará a terra.", referencia: "Sl 37,11" },
  "7-15": { citacao: "Aprendei de mim, que sou manso e humilde de coração.", referencia: "Mt 11,29" },
  "7-16": { citacao: "Aquele que se humilhar será exaltado.", referencia: "Mt 23,12", tema: "N. Sra. do Carmo" },
  "7-17": { citacao: "Toda árvore boa produz frutos bons.", referencia: "Mt 7,17" },
  "7-18": { citacao: "Senhor, ensina-nos a orar.", referencia: "Lc 11,1" },
  "7-19": { citacao: "O teu Pai que vê em segredo te recompensará.", referencia: "Mt 6,6" },
  "7-20": { citacao: "Deus poderá enriquecer-vos em toda a graça.", referencia: "2Cor 9,8" },
  "7-21": { citacao: "Sede fortes e corajosos.", referencia: "Js 1,9" },
  "7-22": { citacao: "Maria foi ao sepulcro e viu que a pedra tinha sido removida.", referencia: "Jo 20,1", tema: "Sta. Maria Madalena" },
  "7-23": { citacao: "O amor nunca passará.", referencia: "1Cor 13,8" },
  "7-24": { citacao: "Pedi e recebereis; buscai e achareis.", referencia: "Lc 11,9" },
  "7-25": { citacao: "Quem quiser salvar a sua vida perdê-la-á.", referencia: "Mc 8,35", tema: "S. Tiago Apóstolo" },
  "7-26": { citacao: "Honra a teu pai e a tua mãe.", referencia: "Ex 20,12", tema: "Ss. Joaquim e Ana" },
  "7-27": { citacao: "O Senhor é bom para com todos os que o procuram.", referencia: "Lm 3,25" },
  "7-28": { citacao: "Não deixes cair-te o livro desta lei da boca.", referencia: "Js 1,8" },
  "7-29": { citacao: "Marta, Marta, andas preocupada e agitada com muitas coisas.", referencia: "Lc 10,41", tema: "Sta. Marta" },
  "7-30": { citacao: "Jesus chamou-os, e eles imediatamente deixaram a barca e o seguiram.", referencia: "Mt 4,21-22" },
  "7-31": { citacao: "Em tudo glorificai a Deus.", referencia: "1Cor 10,31", tema: "S. Inácio de Loyola" },
  // Agosto
  "8-1":  { citacao: "Orai sem cessar.", referencia: "1Ts 5,17" },
  "8-2":  { citacao: "O perdão e a misericórdia estão com o Senhor.", referencia: "Sl 130,7" },
  "8-3":  { citacao: "Ide, não peques mais.", referencia: "Jo 8,11" },
  "8-4":  { citacao: "O sacerdote é mediador entre Deus e os homens.", referencia: "cf. 1Tm 2,5" },
  "8-5":  { citacao: "Acolhei uns aos outros como Cristo vos acolheu.", referencia: "Rm 15,7" },
  "8-6":  { citacao: "Este é o meu Filho amado; a ele ouvi!", referencia: "Mc 9,7", tema: "Transfiguração do Senhor" },
  "8-7":  { citacao: "Deus nos criou para boas obras.", referencia: "Ef 2,10" },
  "8-8":  { citacao: "Sede imitadores de Deus como filhos queridos.", referencia: "Ef 5,1" },
  "8-9":  { citacao: "A caridade cobre uma multidão de pecados.", referencia: "1Pd 4,8" },
  "8-10": { citacao: "Quem serve a mim, meu Pai o honrará.", referencia: "Jo 12,26" },
  "8-11": { citacao: "Não tenhas medo, acredita somente.", referencia: "Mc 5,36" },
  "8-12": { citacao: "A graça de Deus é mais abundante que o pecado.", referencia: "Rm 5,20" },
  "8-13": { citacao: "Não endureçais o coração como em Meriba.", referencia: "Sl 95,8" },
  "8-14": { citacao: "Jesus tomou o pão, deu graças e o partiu.", referencia: "Lc 22,19" },
  "8-15": { citacao: "Engrandece a minha alma o Senhor.", referencia: "Lc 1,46", tema: "Assunção de Maria" },
  "8-16": { citacao: "Deus não nos deu um espírito de covardia, mas de fortaleza.", referencia: "2Tm 1,7" },
  "8-17": { citacao: "O Espírito intercede por nós com gemidos inexprimíveis.", referencia: "Rm 8,26" },
  "8-18": { citacao: "Vós sois o templo de Deus vivo.", referencia: "2Cor 6,16" },
  "8-19": { citacao: "Quem quiser ser o primeiro seja o servo de todos.", referencia: "Mc 9,35" },
  "8-20": { citacao: "Sede sábios e sem malícia.", referencia: "Rm 16,19", tema: "S. Bernardo" },
  "8-21": { citacao: "O caminho do Senhor é a fortaleza do íntegro.", referencia: "Pr 10,29" },
  "8-22": { citacao: "Ave Maria, cheia de graça, o Senhor é contigo.", referencia: "Lc 1,28", tema: "Maria Rainha" },
  "8-23": { citacao: "Sede santos, porque eu, o Senhor vosso Deus, sou santo.", referencia: "Lv 19,2" },
  "8-24": { citacao: "Tu és o Filho de Deus, tu és o Rei de Israel.", referencia: "Jo 1,49", tema: "S. Bartolomeu" },
  "8-25": { citacao: "Tende cuidado com os pequenos, porque os seus anjos veem sempre a face do Pai.", referencia: "Mt 18,10" },
  "8-26": { citacao: "Permanecei em mim e eu permanecerei em vós.", referencia: "Jo 15,4" },
  "8-27": { citacao: "Sede dóceis de palavra e não somente de coração.", referencia: "cf. Tg 1,22" },
  "8-28": { citacao: "Nosso coração fica inquieto enquanto não repousa em ti, ó Senhor.", referencia: "Sto. Agostinho", tema: "S. Agostinho" },
  "8-29": { citacao: "É preciso que ele cresça e eu diminua.", referencia: "Jo 3,30", tema: "Decapitação de S. João Batista" },
  "8-30": { citacao: "A graça e a paz de Deus sejam convosco.", referencia: "1Cor 1,3" },
  "8-31": { citacao: "O Senhor é bom; sua misericórdia dura para sempre.", referencia: "Sl 100,5" },
  // Setembro
  "9-1":  { citacao: "Louvai ao Senhor, porque é bom louvar ao nosso Deus.", referencia: "Sl 147,1" },
  "9-2":  { citacao: "Cuidai dos pequenos, pois seu anjo está diante de Deus.", referencia: "Mt 18,10" },
  "9-3":  { citacao: "Sede dóceis à palavra que foi plantada em vós.", referencia: "Tg 1,21" },
  "9-4":  { citacao: "Não sede escravos do dinheiro; contentai-vos com o que tendes.", referencia: "Hb 13,5" },
  "9-5":  { citacao: "O que fizerdes ao menor dos meus irmãos, a mim o fizestes.", referencia: "Mt 25,40" },
  "9-6":  { citacao: "Escolhe a vida para que vivas, tu e a tua posteridade.", referencia: "Dt 30,19" },
  "9-7":  { citacao: "Bem-aventurado o homem cuja força está em ti.", referencia: "Sl 84,6" },
  "9-8":  { citacao: "Nasceu a Virgem Maria, a Mãe de Deus.", referencia: "cf. Tradição", tema: "Natividade de Maria" },
  "9-9":  { citacao: "O Filho do Homem veio procurar e salvar o que estava perdido.", referencia: "Lc 19,10" },
  "9-10": { citacao: "Quem ouve as minhas palavras e as pratica, é semelhante ao homem prudente.", referencia: "Mt 7,24" },
  "9-11": { citacao: "Não temas, pois eu te remi; chamei-te pelo teu nome, tu és meu.", referencia: "Is 43,1" },
  "9-12": { citacao: "O Senhor é a nossa rocha, fortaleza e libertador.", referencia: "Sl 18,3" },
  "9-13": { citacao: "A graça e a misericórdia estão com os seus escolhidos.", referencia: "Sb 3,9" },
  "9-14": { citacao: "Quanto a mim, longe de mim gloriar-me senão na cruz de Nosso Senhor Jesus Cristo.", referencia: "Gl 6,14", tema: "Exaltação da Santa Cruz" },
  "9-15": { citacao: "Uma espada traspassará a tua própria alma.", referencia: "Lc 2,35", tema: "Nossa Sra. das Dores" },
  "9-16": { citacao: "Sede santos na vossa maneira de viver.", referencia: "1Pd 1,15" },
  "9-17": { citacao: "Não vos deu Deus um espírito de temor, mas de poder, de amor e de sabedoria.", referencia: "2Tm 1,7" },
  "9-18": { citacao: "O amor de Cristo nos urge.", referencia: "2Cor 5,14" },
  "9-19": { citacao: "Que aproveita ao homem ganhar o mundo inteiro, se perder a sua alma?", referencia: "Mt 16,26" },
  "9-20": { citacao: "Perseverai na fé, robustecer-vos-á.", referencia: "cf. Cl 1,23" },
  "9-21": { citacao: "Levantou-se, deixou tudo e foi após ele.", referencia: "Lc 5,28", tema: "S. Mateus" },
  "9-22": { citacao: "Sede humildes e obedientes uns com os outros.", referencia: "1Pd 5,5" },
  "9-23": { citacao: "Quem sabe ganhar almas é sábio.", referencia: "Pr 11,30", tema: "S. Pio de Pietrelcina" },
  "9-24": { citacao: "A fé sem obras é morta.", referencia: "Tg 2,26" },
  "9-25": { citacao: "Onde dois ou três estiverem reunidos em meu nome, ali estarei.", referencia: "Mt 18,20" },
  "9-26": { citacao: "Sede cheios do conhecimento da vontade de Deus.", referencia: "Cl 1,9" },
  "9-27": { citacao: "Alegrai-vos no Senhor sempre; tornei a dizer, alegrai-vos!", referencia: "Fl 4,4" },
  "9-28": { citacao: "Não sejais vencidos pelo mal; vencei o mal com o bem.", referencia: "Rm 12,21" },
  "9-29": { citacao: "Miguel, Gabriel e Rafael, anjos de Deus, estão diante do Trono.", referencia: "cf. Ap 8,2", tema: "Arcanjos" },
  "9-30": { citacao: "A Escritura nunca vos enganará se dela vos aproximardes com humildade.", referencia: "cf. S. Jerônimo", tema: "S. Jerônimo" },
  // Outubro
  "10-1": { citacao: "Se não vos tornais como crianças, não entrareis no reino dos céus.", referencia: "Mt 18,3", tema: "Sta. Teresinha" },
  "10-2": { citacao: "Os vossos anjos veem sempre a face de meu Pai.", referencia: "Mt 18,10", tema: "Anjos da Guarda" },
  "10-3": { citacao: "Sede fiéis até a morte e dar-vos-ei a coroa da vida.", referencia: "Ap 2,10" },
  "10-4": { citacao: "Louvado sejas, meu Senhor, com todas as tuas criaturas.", referencia: "Sto. Francisco", tema: "S. Francisco de Assis" },
  "10-5": { citacao: "A lei do Senhor é perfeita, ela restaura a alma.", referencia: "Sl 19,8" },
  "10-6": { citacao: "Sede perfeitos no amor, como o Pai celestial é perfeito.", referencia: "Mt 5,48" },
  "10-7": { citacao: "A mulher do Apocalipse: grávida de vida e de esperança.", referencia: "cf. Ap 12,1", tema: "N. Sra. do Rosário" },
  "10-8": { citacao: "Rezai o Rosário, meditai os Mistérios.", referencia: "Tradição Mariana" },
  "10-9": { citacao: "Buscai as coisas do alto, onde Cristo está sentado.", referencia: "Cl 3,1" },
  "10-10": { citacao: "Sede vigilantes e orai para não cairdes em tentação.", referencia: "Mc 14,38" },
  "10-11": { citacao: "O Senhor é o rei dos reis; todos os povos louvarão o seu nome.", referencia: "cf. Sl 97,1" },
  "10-12": { citacao: "Quem me encontrar, encontrou a vida.", referencia: "Pr 8,35", tema: "N. Sra. Aparecida" },
  "10-13": { citacao: "Ela nos disse: fazei tudo o que ele vos disser.", referencia: "Jo 2,5", tema: "Ap. de Fátima" },
  "10-14": { citacao: "A caridade de Cristo nos acompanha todos os dias.", referencia: "cf. Rm 8,35" },
  "10-15": { citacao: "Nada te turbe, nada te espante; só Deus basta.", referencia: "Sta. Teresa de Ávila", tema: "Sta. Teresa de Ávila" },
  "10-16": { citacao: "Não tenhais medo! Abri as portas a Cristo!", referencia: "S. João Paulo II", tema: "S. João Paulo II" },
  "10-17": { citacao: "É um bem para mim estar junto de Deus.", referencia: "Sl 73,28" },
  "10-18": { citacao: "A messe é grande, mas os operários são poucos.", referencia: "Lc 10,2", tema: "S. Lucas" },
  "10-19": { citacao: "Para mim, viver é Cristo e morrer é lucro.", referencia: "Fl 1,21" },
  "10-20": { citacao: "Quem vos dá ouvidos a mim dá ouvidos.", referencia: "Lc 10,16" },
  "10-21": { citacao: "Sede sábios como as serpentes e simples como as pombas.", referencia: "Mt 10,16" },
  "10-22": { citacao: "Não tenhais medo; sede corajosos.", referencia: "Dt 31,6" },
  "10-23": { citacao: "Qui potest capere, capiat: Quem puder entender, entenda.", referencia: "Mt 19,12" },
  "10-24": { citacao: "Preparai o caminho do Senhor.", referencia: "Is 40,3" },
  "10-25": { citacao: "Combate o bom combate da fé.", referencia: "1Tm 6,12" },
  "10-26": { citacao: "É ele quem nos fez, somos seus; seu povo, o rebanho que ele apascenta.", referencia: "Sl 100,3" },
  "10-27": { citacao: "Sede portanto imitadores de Deus.", referencia: "Ef 5,1" },
  "10-28": { citacao: "Não sois do mundo, mas eu vos escolhi dentre o mundo.", referencia: "Jo 15,19", tema: "Ss. Simão e Judas" },
  "10-29": { citacao: "Permanecei firmes, inabaláveis, sempre abundantes na obra do Senhor.", referencia: "1Cor 15,58" },
  "10-30": { citacao: "Sede pacientes na tribulação.", referencia: "Rm 12,12" },
  "10-31": { citacao: "Todos os santos que viveram na graça de Deus.", referencia: "cf. Ap 7,9" },
  // Novembro
  "11-1": { citacao: "Bem-aventurados os limpos de coração, porque eles verão a Deus.", referencia: "Mt 5,8", tema: "Todos os Santos" },
  "11-2": { citacao: "Bem-aventurados os mortos que morrem no Senhor.", referencia: "Ap 14,13", tema: "Finados" },
  "11-3": { citacao: "A memória do justo é uma bênção.", referencia: "Pr 10,7" },
  "11-4": { citacao: "Sede fortes e corajosos; não tenhais medo.", referencia: "Dt 31,6" },
  "11-5": { citacao: "Sede dóceis uns com os outros com misericórdia.", referencia: "Ef 4,32" },
  "11-6": { citacao: "O amor é paciente; o amor é benigno.", referencia: "1Cor 13,4" },
  "11-7": { citacao: "Sede sempre prontos para dar razão da vossa esperança.", referencia: "1Pd 3,15" },
  "11-8": { citacao: "Nada acontece sem a vontade de vosso Pai.", referencia: "Mt 10,29" },
  "11-9": { citacao: "Destruí este templo e em três dias o reconstruirei.", referencia: "Jo 2,19" },
  "11-10": { citacao: "O sábio transmite o que sabe; o conhecimento não é vaidade.", referencia: "cf. Ecl 12,9" },
  "11-11": { citacao: "Quem cuida dos pobres empresta ao Senhor.", referencia: "Pr 19,17" },
  "11-12": { citacao: "Sede imitadores de Deus, como filhos amados.", referencia: "Ef 5,1" },
  "11-13": { citacao: "Em verdade vos digo: o que fizerdes ao menor dos meus irmãos, a mim o fizestes.", referencia: "Mt 25,40" },
  "11-14": { citacao: "Permanecei no amor de Deus e esperai a misericórdia do Senhor.", referencia: "Jd 1,21" },
  "11-15": { citacao: "O Senhor está perto de todos os que o invocam com sinceridade.", referencia: "Sl 145,18" },
  "11-16": { citacao: "O amor de Deus está derramado em nossos corações.", referencia: "Rm 5,5" },
  "11-17": { citacao: "O que semeardes isso também colhereis.", referencia: "Gl 6,7" },
  "11-18": { citacao: "Sede sábios e perseverantes na oração.", referencia: "cf. Rm 12,12" },
  "11-19": { citacao: "Alegrai-vos com os que estão alegres; chorai com os que choram.", referencia: "Rm 12,15" },
  "11-20": { citacao: "Cristo é a cabeça de todo principado e poder.", referencia: "Cl 2,10" },
  "11-21": { citacao: "Maria foi apresentada no Templo como morada de Deus.", referencia: "cf. Lc 2,22", tema: "Apresentação de Maria" },
  "11-22": { citacao: "Cantai ao Senhor um cântico novo.", referencia: "Sl 96,1" },
  "11-23": { citacao: "O reino de Deus é justiça, paz e alegria no Espírito Santo.", referencia: "Rm 14,17" },
  "11-24": { citacao: "A graça e a paz vos sejam dadas abundantemente.", referencia: "1Pd 1,2" },
  "11-25": { citacao: "Sede firmes na fé, irmãos.", referencia: "1Cor 16,13" },
  "11-26": { citacao: "O Senhor vem julgar a terra com justiça.", referencia: "Sl 98,9" },
  "11-27": { citacao: "Vinde, benditos de meu Pai; herdai o reino.", referencia: "Mt 25,34" },
  "11-28": { citacao: "Levantai as cabeças, porque a vossa redenção está próxima.", referencia: "Lc 21,28" },
  "11-29": { citacao: "O Advento: esperai e vigiai, pois não sabeis o dia.", referencia: "cf. Mt 25,13" },
  "11-30": { citacao: "Vinde após mim e eu vos farei pescadores de homens.", referencia: "Mt 4,19", tema: "S. André" },
  // Dezembro
  "12-1": { citacao: "Aquele que vem está próximo; não se atrasará.", referencia: "Hb 10,37" },
  "12-2": { citacao: "Vigiai, pois não sabeis o dia nem a hora.", referencia: "Mt 25,13" },
  "12-3": { citacao: "Ide pelo mundo todo e anunciai o Evangelho.", referencia: "Mc 16,15", tema: "S. Francisco Xavier" },
  "12-4": { citacao: "Aonde tu fordes, irei; onde morreres, morrerei.", referencia: "Rt 1,16" },
  "12-5": { citacao: "O lobo habitará com o cordeiro.", referencia: "Is 11,6" },
  "12-6": { citacao: "O que semear em bênçãos colherá em bênçãos.", referencia: "2Cor 9,6" },
  "12-7": { citacao: "Sede santos, porque eu sou o Senhor vosso Deus.", referencia: "Lv 19,2" },
  "12-8": { citacao: "Cheia de graça, o Senhor é contigo; bendita és entre as mulheres.", referencia: "Lc 1,28", tema: "Imaculada Conceição" },
  "12-9": { citacao: "Graça a vós e paz de Deus nosso Pai e do Senhor Jesus Cristo.", referencia: "Rm 1,7" },
  "12-10": { citacao: "Eis que a virgem conceberá e dará à luz um filho.", referencia: "Is 7,14" },
  "12-11": { citacao: "Alegrai-vos no Senhor sempre.", referencia: "Fl 4,4" },
  "12-12": { citacao: "Que todo o vosso trato seja sem avareza, contentes com o que tendes.", referencia: "Hb 13,5" },
  "12-13": { citacao: "Resplandecerá como o sol no Reino do Pai.", referencia: "Mt 13,43" },
  "12-14": { citacao: "Para onde quer que ele for, o seguirei.", referencia: "Ap 14,4" },
  "12-15": { citacao: "Estai na expectativa do Senhor e ele vos salvará.", referencia: "cf. Sl 27,14" },
  "12-16": { citacao: "E vós, filhos, crescei no temor do Senhor.", referencia: "Ef 6,4" },
  "12-17": { citacao: "O Senhor, nosso justo, está próximo.", referencia: "cf. Sl 85,10" },
  "12-18": { citacao: "José, filho de Davi, não temas receber Maria.", referencia: "Mt 1,20" },
  "12-19": { citacao: "Como me é dado que venha ter comigo a mãe do meu Senhor?", referencia: "Lc 1,43" },
  "12-20": { citacao: "O Senhor é o rei eterno; a sua misericórdia dura para sempre.", referencia: "Sl 136,1" },
  "12-21": { citacao: "Magnificat: engrandece a minha alma o Senhor.", referencia: "Lc 1,46" },
  "12-22": { citacao: "Abençoada a que acreditou na realização do que o Senhor lhe disse.", referencia: "Lc 1,45" },
  "12-23": { citacao: "O Espírito Santo descerá sobre ti.", referencia: "Lc 1,35" },
  "12-24": { citacao: "Eis que a virgem está grávida e dará à luz um filho, Emanuel.", referencia: "Is 7,14" },
  "12-25": { citacao: "Foi dado à luz seu filho primogênito... porque não havia lugar para eles.", referencia: "Lc 2,7", tema: "Natal do Senhor" },
  "12-26": { citacao: "Não sede vencidos pelo mal; vencei o mal com o bem.", referencia: "Rm 12,21", tema: "S. Estevão" },
  "12-27": { citacao: "Deus é amor e quem permanece no amor permanece em Deus.", referencia: "1Jo 4,16", tema: "S. João Evangelista" },
  "12-28": { citacao: "Um grito se ouviu em Ramá... Raquel chora seus filhos.", referencia: "Mt 2,18", tema: "Santos Inocentes" },
  "12-29": { citacao: "Crescia em sabedoria, em estatura e em graça.", referencia: "Lc 2,52" },
  "12-30": { citacao: "O menino crescia e se tornava robusto, cheio de sabedoria.", referencia: "Lc 2,40" },
  "12-31": { citacao: "Graças a Deus que nos dá a vitória por Jesus Cristo.", referencia: "1Cor 15,57" },
};

export default function CalendarioLiturgico({ onClose }: { onClose?: () => void } = {}) {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [liturgiaDiaria, setLiturgiaDiaria] = useState<any>(null);
  const [loadingLiturgia, setLoadingLiturgia] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (selectedDay !== null) {
      const fetchLiturgia = async () => {
        setLoadingLiturgia(true);
        try {
          const d = String(selectedDay).padStart(2, '0');
          const m = String(currentMonth + 1).padStart(2, '0');
          const res = await fetch(`https://liturgia.up.railway.app/?dia=${d}&mes=${m}`);
          if (res.ok) {
            const data = await res.json();
            setLiturgiaDiaria(data);
          } else {
            setLiturgiaDiaria(null);
          }
        } catch (error) {
          console.error("Erro ao buscar liturgia", error);
          setLiturgiaDiaria(null);
        } finally {
          setLoadingLiturgia(false);
        }
      };
      fetchLiturgia();
    } else {
      setLiturgiaDiaria(null);
    }
  }, [selectedDay, currentMonth]);
  const [noteContent, setNoteContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Data fetching
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: catequistas = [] } = useCatequistas();
  const { data: notas = [] } = useCalendarioNotas();
  const { data: encontros = [] } = useEncontros();
  const { data: atividades = [] } = useAtividades();
  const { data: reunioes = [] } = useReunioes();
  const { data: turmas = [] } = useTurmas();
  
  const notaMutation = useCalendarioNotaMutation();
  const notaDelete = useDeleteCalendarioNota();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Helper to check birthdays
  const birthdays = useMemo(() => {
    const list: { day: number; name: string; type: 'catequizando' | 'catequista' }[] = [];
    
    [...catequizandos, ...catequistas].forEach(person => {
      if (person.dataNascimento) {
        const [y, m, d] = person.dataNascimento.split('-');
        if (parseInt(m) === currentMonth + 1) {
          list.push({ 
            day: parseInt(d), 
            name: person.nome, 
            type: (person as any).turmaId ? 'catequizando' : 'catequista' 
          });
        }
      }
    });
    return list;
  }, [catequizandos, catequistas, currentMonth]);

  const monthNotes = useMemo(() => {
    return notas.filter(n => n.data.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`));
  }, [notas, currentMonth, currentYear]);

  // Map Encontros, Atividades and Reunioes to the current month days
  const currentMonthEvents = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return {
      encontros: encontros.filter(e => e.data && e.data.startsWith(prefix)),
      atividades: atividades.filter(a => a.data && a.data.startsWith(prefix)),
      reunioes: reunioes.filter(r => r.data && r.data.startsWith(prefix))
    };
  }, [encontros, atividades, reunioes, currentMonth, currentYear]);

  const getDayColor = (day: number) => {
    const evt = EVENTS.find(e => e.month === currentMonth + 1 && e.day === day);
    if (evt?.color) return COLOR_MAP[evt.color];
    
    // Default Liturgical Colors based on Month (Very simplified)
    if (currentMonth === 11 || currentMonth === 0) return COLOR_MAP['branco']; // Natal/Epifania (approx)
    if (currentMonth === 2 || currentMonth === 3) return COLOR_MAP['roxo']; // Quaresma (approx)
    return COLOR_MAP['verde']; // Tempo Comum
  };

  const isToday = (day: number) => 
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const handleSaveNote = async () => {
    if (!selectedDay) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    try {
      await notaMutation.mutateAsync({
        id: noteId || crypto.randomUUID(),
        data: dateStr,
        nota: noteContent
      });
      toast.success("Anotação salva!");
      setIsEditingNote(false);
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await notaDelete.mutateAsync(id);
      toast.success("Anotação excluída");
      setSelectedDay(null);
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  useEffect(() => {
    if (selectedDay) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const existing = notas.find(n => n.data === dateStr);
      setNoteContent(existing?.nota || "");
      setNoteId(existing?.id || null);
      setIsEditingNote(false);
    }
  }, [selectedDay, notas, currentMonth, currentYear]);

  return (
    <div className={`flex flex-col gap-4 transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] bg-background p-6 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isFullscreen) setIsFullscreen(false);
              else if (onClose) onClose();
              else navigate("/");
            }}
            className="back-btn bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-2 border-white dark:border-zinc-700 shadow-md"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <Church className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Agenda catequética</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ano {currentYear}</p>
            </div>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Calendar Card */}
      <div className={`float-card overflow-hidden animate-float-up flex flex-col ${isFullscreen ? 'flex-1 shadow-2xl border-2 border-primary/10' : ''}`}>
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm border border-border/20">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-2xl font-black text-foreground tracking-tight px-4">
            {MONTH_NAMES[currentMonth]}
          </h2>
          <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm border border-border/20">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className={`p-4 ${isFullscreen ? 'flex-1' : ''}`}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className={`text-center text-xs font-black uppercase py-2 ${i === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={`grid grid-cols-7 gap-1.5 ${isFullscreen ? 'flex-1 h-full' : ''}`}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-20 border border-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const liturgicalEvts = EVENTS.filter(e => e.month === currentMonth + 1 && e.day === day);
              const dayBirthdays = birthdays.filter(b => b.day === day);
              const dayNote = monthNotes.find(n => n.data === dateStr);
              const colorClasses = getDayColor(day);
              const todayMark = isToday(day);

              const hasAnyIndicator = liturgicalEvts.length > 0 || dayBirthdays.length > 0 ||
                currentMonthEvents.encontros.some(e => e.data.endsWith(`-${String(day).padStart(2, '0')}`)) ||
                currentMonthEvents.atividades.some(a => a.data.endsWith(`-${String(day).padStart(2, '0')}`)) ||
                currentMonthEvents.reunioes.some(r => r.data.endsWith(`-${String(day).padStart(2, '0')}`)) ||
                !!dayNote;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-2xl flex flex-col transition-all border-2 overflow-hidden active:scale-95 group
                    ${todayMark ? 'ring-2 ring-primary ring-offset-2 z-10' : ''}
                    ${colorClasses} hover:brightness-95 hover:shadow-md
                    ${isFullscreen ? 'items-start text-left p-3' : 'p-1 justify-start items-center'}
                  `}
                >
                  {/* Número do dia — sempre no topo, nunca empurrado */}
                  <span className={`text-sm font-black leading-none ${todayMark ? 'text-primary' : ''} ${!isFullscreen ? 'mt-1' : ''}`}>{day}</span>

                  {/* Indicadores (vista compacta) — abaixo do número */}
                  {!isFullscreen && hasAnyIndicator && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                      {liturgicalEvts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                      {dayBirthdays.length > 0 && <Cake className="h-2.5 w-2.5 text-pink-500" />}
                      {currentMonthEvents.encontros.some(e => e.data.endsWith(`-${String(day).padStart(2, '0')}`)) && <BookOpen className="h-2.5 w-2.5 text-blue-500" />}
                      {currentMonthEvents.atividades.some(a => a.data.endsWith(`-${String(day).padStart(2, '0')}`)) && <Lightbulb className="h-2.5 w-2.5 text-emerald-500" />}
                      {currentMonthEvents.reunioes.some(r => r.data.endsWith(`-${String(day).padStart(2, '0')}`)) && <Users className="h-2.5 w-2.5 text-violet-500" />}
                      {dayNote && <StickyNote className="h-2.5 w-2.5 text-amber-500" />}
                    </div>
                  )}

                  {/* Fullscreen: lista de eventos */}
                  {isFullscreen && (
                    <div className="flex-1 w-full mt-1.5 space-y-1.5 overflow-hidden">
                      {liturgicalEvts.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-background/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-border/10">
                          <Star className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none uppercase">{e.name}</span>
                        </div>
                      ))}
                      {dayBirthdays.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-pink-500/10 rounded-lg px-2 py-1 border border-pink-200/20 text-pink-700 dark:text-pink-400">
                          <Cake className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{b.name}</span>
                        </div>
                      ))}
                      {currentMonthEvents.encontros.filter(e => e.data.endsWith(`-${String(day).padStart(2, '0')}`)).map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-500/10 rounded-lg px-2 py-1 border border-blue-200/20 text-blue-700 dark:text-blue-400">
                          <BookOpen className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{e.tema}</span>
                        </div>
                      ))}
                      {currentMonthEvents.atividades.filter(a => a.data.endsWith(`-${String(day).padStart(2, '0')}`)).map((a, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-success/10 rounded-lg px-2 py-1 border border-success/20 text-success">
                          <Lightbulb className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{a.nome}</span>
                        </div>
                      ))}
                      {currentMonthEvents.reunioes.filter(r => r.data.endsWith(`-${String(day).padStart(2, '0')}`)).map((r, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-violet-500/10 rounded-lg px-2 py-1 border border-violet-200/20 text-violet-700 dark:text-violet-400">
                          <Users className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{r.nome}</span>
                        </div>
                      ))}
                      {dayNote && (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-lg px-2 py-1 border border-amber-200/20 text-amber-700 dark:text-amber-400">
                          <StickyNote className="h-2.5 w-2.5 shrink-0" />
                          <p className="text-[9px] font-medium truncate leading-none italic">{dayNote.nota.substring(0, 20)}...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!isFullscreen && liturgicalEvts.length > 0 && (
                    <div className="absolute top-1 right-1">
                      <Star className="h-2 w-2 opacity-40" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Note Editor Modal */}
      {/* Selected Day Details */}
      {selectedDay !== null && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-border/30 animate-fade-in mt-2 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <StickyNote className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-foreground">{selectedDay} de {MONTH_NAMES[currentMonth]}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Anotações e Eventos</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDay(null)}
              className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors shadow-md border-2 border-white dark:border-zinc-700"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Liturgia Diária */}
            {/* Liturgia Diária */}
            {(loadingLiturgia || liturgiaDiaria) && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/40">
                {/* Faixa lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
                <div className="p-4 pl-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
                      <Scroll className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em]">Liturgia Diária</span>
                      {liturgiaDiaria?.liturgia && (
                        <span className="block text-[9px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider">{liturgiaDiaria.liturgia}</span>
                      )}
                    </div>
                  </div>
                  
                  {loadingLiturgia ? (
                    <div className="animate-pulse space-y-3 py-2">
                      <div className="h-3 bg-amber-200/50 dark:bg-amber-800/50 rounded w-3/4"></div>
                      <div className="h-3 bg-amber-200/50 dark:bg-amber-800/50 rounded w-1/2"></div>
                      <div className="h-3 bg-amber-200/50 dark:bg-amber-800/50 rounded w-2/3"></div>
                    </div>
                  ) : liturgiaDiaria ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar text-[13px] text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                      {liturgiaDiaria.primeiraLeitura && typeof liturgiaDiaria.primeiraLeitura !== 'string' && (
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Primeira Leitura ({liturgiaDiaria.primeiraLeitura.referencia})</p>
                          <p className="whitespace-pre-wrap">{liturgiaDiaria.primeiraLeitura.texto}</p>
                        </div>
                      )}
                      {liturgiaDiaria.salmo && typeof liturgiaDiaria.salmo !== 'string' && (
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Salmo ({liturgiaDiaria.salmo.referencia})</p>
                          <p className="italic mb-1 font-medium">{liturgiaDiaria.salmo.refrao}</p>
                          <p className="whitespace-pre-wrap">{liturgiaDiaria.salmo.texto}</p>
                        </div>
                      )}
                      {liturgiaDiaria.segundaLeitura && typeof liturgiaDiaria.segundaLeitura !== 'string' && (
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Segunda Leitura ({liturgiaDiaria.segundaLeitura.referencia})</p>
                          <p className="whitespace-pre-wrap">{liturgiaDiaria.segundaLeitura.texto}</p>
                        </div>
                      )}
                      {liturgiaDiaria.evangelho && typeof liturgiaDiaria.evangelho !== 'string' && (
                        <div>
                          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Evangelho ({liturgiaDiaria.evangelho.referencia})</p>
                          <p className="whitespace-pre-wrap">{liturgiaDiaria.evangelho.texto}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Liturgical Info */}
            {EVENTS.filter(e => e.month === currentMonth + 1 && e.day === selectedDay).map((e, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border ${COLOR_MAP[e.color || 'verde']} flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-lg bg-background/40 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">{e.name}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70 tracking-tighter">{TYPE_CONFIG[e.type].label}</p>
                </div>
              </div>
            ))}

            {/* Birthday Info */}
            {birthdays.filter(b => b.day === selectedDay).map((b, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-pink-500/10 border border-pink-200/30 text-pink-700 dark:text-pink-400 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                  <Cake className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Aniversário de {b.name}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70">{b.type === 'catequista' ? 'Catequista' : 'Catequizando'}</p>
                </div>
              </div>
            ))}
            
            {/* Catechism Encounters - CLICKABLE */}
            {currentMonthEvents.encontros.filter(e => e.data.endsWith(`-${String(selectedDay).padStart(2, '0')}`)).map((e, idx) => {
              const turma = turmas.find(t => t.id === e.turmaId);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (turma?.id && e.turmaId) {
                      navigate(`/turmas/${e.turmaId}/encontros/${e.id}`);
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-blue-500/10 border border-blue-200/30 text-blue-700 dark:text-blue-400 flex items-center gap-3 hover:bg-blue-500/20 transition-all active:scale-[0.98] group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{e.tema}</p>
                    <p className="text-[10px] uppercase font-bold opacity-70 truncate block">Encontro · {turma?.nome || 'Turma'}</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}

            {/* Activities/Events - CLICKABLE */}
            {currentMonthEvents.atividades.filter(a => a.data.endsWith(`-${String(selectedDay).padStart(2, '0')}`)).map((a, idx) => {
              const turma = turmas.find(t => t.id === a.turmaId);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (a.turmaId) {
                      navigate(`/turmas/${a.turmaId}/eventos?view=${a.id}`);
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-200/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-3 hover:bg-emerald-500/20 transition-all active:scale-[0.98] group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{a.nome}</p>
                    <p className="text-[10px] uppercase font-bold opacity-70 truncate block">Evento · {a.tipo}{turma ? ` · ${turma.nome}` : ''}</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}

            {/* Reunioes - CLICKABLE */}
            {currentMonthEvents.reunioes.filter(r => r.data.endsWith(`-${String(selectedDay).padStart(2, '0')}`)).map((r, idx) => {
              const turma = turmas.find(t => t.id === r.turmaId);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (r.turmaId) {
                      navigate(`/turmas/${r.turmaId}/reunioes?view=${r.id}`);
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-violet-500/10 border border-violet-200/30 text-violet-700 dark:text-violet-400 flex items-center gap-3 hover:bg-violet-500/20 transition-all active:scale-[0.98] group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{r.nome}</p>
                    <p className="text-[10px] uppercase font-bold opacity-70 truncate block">Reunião · {r.tipo}{turma ? ` · ${turma.nome}` : ''}</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}

            {/* Note Area */}
            {isEditingNote ? (
              <div className="space-y-3 animate-fade-in mt-4 border-t border-border/20 pt-4">
                <label className="text-xs font-bold text-zinc-900 uppercase px-1">Minhas Anotações</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ex: Reunião de pais às 19h..."
                  className="w-full min-h-[120px] p-4 rounded-2xl bg-muted/30 border border-border/20 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm resize-none shadow-inner"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingNote(false)}
                    className="p-3 rounded-2xl text-muted-foreground hover:bg-muted transition-colors border border-transparent"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleSaveNote}
                    disabled={notaMutation.isPending}
                    className="flex-1 action-btn py-3 justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {notaMutation.isPending ? "..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-border/20 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-900 uppercase px-1">Anotações do Dia</label>
                  {!noteContent && (
                    <button 
                      onClick={() => setIsEditingNote(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[11px] font-bold active:scale-95"
                    >
                      <Plus className="h-3 w-3" /> Adicionar
                    </button>
                  )}
                </div>

                {noteContent && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/30 text-amber-800 dark:text-amber-200 relative group transition-all hover:bg-amber-500/15">
                    <div className="flex items-start gap-3">
                      <StickyNote className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 opacity-80" />
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed pr-8">{noteContent}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                       <button onClick={() => setIsEditingNote(true)} className="p-2 rounded-xl bg-background/50 hover:bg-background/80 text-amber-700 shadow-sm transition-colors">
                          <BookOpen className="h-3.5 w-3.5" />
                       </button>
                       <button onClick={() => { handleDeleteNote(noteId!); setIsEditingNote(false); }} className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive shadow-sm transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
