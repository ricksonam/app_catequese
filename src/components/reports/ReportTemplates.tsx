import { cn, formatarDataVigente } from "@/lib/utils";
import { Encontro, Catequizando, Atividade, Turma, Reuniao } from "@/lib/store";
import { Cross } from "lucide-react";

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  paroquia?: string;
  comunidade?: string;
  turma?: string;
  etapa?: string;
}

const PrintHeader = ({ titulo, subtitulo, paroquia, comunidade, turma, etapa }: HeaderProps) => (
  <div className="border-b-2 border-[#2c1810] pb-3 mb-4 text-center">
    <div className="flex justify-center mb-2">
      <div className="w-9 h-9 rounded-full border-2 border-[#2c1810] flex items-center justify-center bg-white">
        <Cross className="h-5 w-5 text-[#2c1810]" />
      </div>
    </div>
    <h1 className="text-lg font-serif font-black uppercase tracking-tight text-[#2c1810]">{titulo}</h1>
    {subtitulo && <p className="text-xs italic font-serif text-[#4a2e1b]">{subtitulo}</p>}
    <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest pt-2 text-[#2c1810] font-sans">
      {paroquia && <span>Paróquia: {paroquia}</span>}
      {comunidade && <span>Comunidade: {comunidade}</span>}
      {turma && <span>Turma: {turma}</span>}
      {etapa && <span>Etapa: {etapa}</span>}
      <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

// ==========================================
// RELATÓRIOS DA TURMA
// ==========================================

export const BoletimTurmaSheet = ({ org, turma, catequizandos, encontros }: any) => {
  const ativos = catequizandos.filter((c: any) => c.status === 'ativo').length;
  return (
    <div className="p-8 text-black bg-white font-sans min-h-screen">
      <PrintHeader 
        titulo="Relatório Geral da Turma" 
        subtitulo="Visão Consolidada de Catequizandos e Encontros"
        paroquia={org.paroquia} 
        comunidade={org.comunidade}
        turma={turma.nome}
        etapa={turma.etapa}
      />
      
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="p-6 border-2 border-[#2c1810] bg-white">
          <h3 className="font-serif font-black text-[#2c1810] uppercase tracking-widest text-sm mb-4 border-b border-[#2c1810] pb-2">Identificação da Turma</h3>
          <div className="space-y-2">
            <p className="text-xl font-black">{turma.nome}</p>
            <p className="text-sm">Etapa: {turma.etapa}</p>
            <p className="text-sm">Ano Letivo: {turma.ano}</p>
          </div>
        </div>
        <div className="p-6 border-2 border-[#2c1810] bg-white">
          <h3 className="font-serif font-black text-[#2c1810] uppercase tracking-widest text-sm mb-4 border-b border-[#2c1810] pb-2">Métricas de Frequência</h3>
          <div className="space-y-2 text-sm font-bold">
            <p className="flex justify-between"><span>Total de Matriculados:</span> <span>{catequizandos.length}</span></p>
            <p className="flex justify-between text-emerald-800"><span>Ativos:</span> <span>{ativos}</span></p>
            <p className="flex justify-between text-red-800"><span>Desistentes/Afastados:</span> <span>{catequizandos.length - ativos}</span></p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-serif font-black uppercase text-[#2c1810] border-b-2 border-[#2c1810] pb-2 mb-4">Progresso do Planejamento</h3>
        <div className="grid grid-cols-3 gap-6 text-center border border-[#2c1810] divide-x divide-[#2c1810]">
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">Encontros Planejados</p>
            <p className="text-3xl font-black">{encontros.length}</p>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">Realizados</p>
            <p className="text-3xl font-black text-emerald-800">{encontros.filter((e: any) => e.status === 'realizado').length}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">Pendentes</p>
            <p className="text-3xl font-black text-amber-800">{encontros.filter((e: any) => e.status === 'pendente').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// ENCONTRO TEMPLATES
// ==========================================

export const EncontroFullSheet = ({ doc, org, turma }: any) => (
  <div className="p-5 text-black bg-white font-sans">
    <PrintHeader 
      titulo="Ficha Técnica de Encontro" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
      etapa={turma.etapa}
    />
    
    <div className="border border-[#2c1810] p-3 mb-3 bg-white">
      <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Tema do Encontro</p>
      <h2 className="text-base font-black uppercase text-[#2c1810]">{doc.tema}</h2>
      {doc.leituraBiblica && (
        <p className="mt-1 border-l-2 border-[#2c1810] pl-2 font-serif italic text-xs text-[#2c1810]">Bíblia: {doc.leituraBiblica}</p>
      )}
      <div className="flex gap-8 mt-2 pt-2 border-t border-gray-200 text-[10px] font-bold uppercase text-gray-600">
        <span>Data: {formatarDataVigente(doc.data)}</span>
        <span>Duração: {doc.roteiro?.reduce((s: number, r: any) => s + (r.tempo || 0), 0) || 0} min</span>
      </div>
    </div>

    <div className="mb-2">
      <h3 className="text-xs font-serif font-black uppercase border-b border-[#2c1810] pb-1 mb-2 tracking-widest text-[#2c1810]">Roteiro e Desenvolvimento</h3>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#2c1810] bg-gray-50">
            <th className="text-left p-1 w-6">#</th>
            <th className="text-left p-1 w-1/4">Etapa</th>
            <th className="text-left p-1">Conteúdo</th>
            <th className="text-right p-1 w-12">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {doc.roteiro?.map((r: any, i: number) => (
            <tr key={i} className="border-b border-gray-200 align-top">
              <td className="p-1 font-black text-[#2c1810]">{i+1}</td>
              <td className="p-1 font-bold uppercase">{r.label}</td>
              <td className="p-1 text-gray-800 whitespace-pre-wrap font-serif">{r.conteudo}</td>
              <td className="p-1 text-right font-bold text-gray-500">{r.tempo}min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {doc.materialApoio && (
      <div className="p-2 border border-[#2c1810] bg-gray-50 mb-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Material de Apoio</p>
        <p className="text-xs font-serif">{doc.materialApoio}</p>
      </div>
    )}

    {doc.avaliacao && (
      <div className="p-2 border border-[#2c1810]">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#2c1810] mb-1">Avaliação Pós-Encontro</p>
        <div className="grid grid-cols-3 gap-2 text-xs font-serif">
          <div><p className="font-sans font-bold text-gray-500 uppercase text-[9px] mb-0.5">Pontos Positivos</p><p className="italic">{doc.avaliacao.pontosPositivos || "—"}</p></div>
          <div><p className="font-sans font-bold text-gray-500 uppercase text-[9px] mb-0.5">A Melhorar</p><p className="italic">{doc.avaliacao.pontosMelhorar || "—"}</p></div>
          <div><p className="font-sans font-bold text-gray-500 uppercase text-[9px] mb-0.5">Conclusão</p><p className="italic font-bold">{doc.avaliacao.conclusao || "—"}</p></div>
        </div>
      </div>
    )}
  </div>
);

export const AttendanceBlankSheet = ({ doc, org, turma, catequizandos }: any) => (
  <div className="p-5 text-black bg-white font-sans">
    <PrintHeader 
      titulo="Registro de Frequência" 
      subtitulo={doc ? `${doc.tema} — ${formatarDataVigente(doc.data)}` : "Ficha em Branco"}
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <table className="w-full border-collapse border border-[#2c1810] text-xs">
      <thead>
        <tr className="bg-gray-100 border-b border-[#2c1810]">
          <th className="border-r border-[#2c1810] p-2 w-10 text-center">Nº</th>
          <th className="border-r border-[#2c1810] p-2 text-left">Nome do Catequizando</th>
          <th className="border-r border-[#2c1810] p-2 w-28 text-center">Presença</th>
          <th className="p-2 text-left">Assinatura</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any, i: number) => (
          <tr key={c.id} className="border-b border-gray-300 h-8">
            <td className="border-r border-[#2c1810] p-1 text-center font-bold">{i+1}</td>
            <td className="border-r border-[#2c1810] p-1 font-bold uppercase">{c.nome}</td>
            <td className="border-r border-[#2c1810] p-1"></td>
            <td className="p-1"></td>
          </tr>
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <tr key={`blank-${i}`} className="h-8 border-b border-gray-200">
            <td className="border-r border-[#2c1810]"></td>
            <td className="border-r border-[#2c1810]"></td>
            <td className="border-r border-[#2c1810]"></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-3 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
      <p>P = Presente • F = Falta • J = Justificada</p>
      <p>Catequista: ___________________________________</p>
    </div>
  </div>
);



export const SemesterAttendanceSheet = ({ org, turma, catequizandos, encontros }: any) => {
  const encs = encontros || [];
  const maxCols = 15;
  const cols = encs.length > 0 ? encs.slice(-maxCols) : Array.from({length: maxCols});
  
  return (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Grade de Frequência Semestral" 
      subtitulo="Acompanhamento contínuo de presenças"
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
      etapa={turma.etapa}
    />
    
    <table className="w-full border-collapse border-2 border-[#2c1810] text-[10px]">
      <thead>
        <tr className="bg-gray-100 border-b-2 border-[#2c1810]">
          <th className="border border-[#2c1810] p-2 w-8">Nº</th>
          <th className="border border-[#2c1810] p-2 text-left uppercase">CATEQUIZANDO</th>
          {cols.map((_: any, i: number) => (
            <th key={i} className="border border-[#2c1810] p-1 w-8 text-center">{i+1}</th>
          ))}
          <th className="border border-[#2c1810] p-2 w-12 text-center uppercase">%</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any, i: number) => (
          <tr key={c.id} className="border-b border-gray-400">
            <td className="border-r border-[#2c1810] p-2 text-center font-bold">{i+1}</td>
            <td className="border-r border-[#2c1810] p-2 font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{c.nome}</td>
            {cols.map((_: any, j: number) => (
              <td key={j} className="border-r border-[#2c1810] p-1 text-center"></td>
            ))}
            <td className="p-2 text-center bg-gray-50 font-bold"></td>
          </tr>
        ))}
      </tbody>
    </table>
    
    <div className="mt-8 grid grid-cols-2 gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
      <p>Visto Coordenação: ___________________________</p>
      <p className="text-right">Semestre/Período: ________ / ________</p>
    </div>
  </div>
)};

// ==========================================
// CATEQUIZANDO TEMPLATES
// ==========================================

export const CatequizandoIndividualSheet = ({ doc, org, turma }: any) => (
  <div className="p-5 text-black bg-white font-sans">
    <PrintHeader 
      titulo="Ficha Cadastral" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <div className="border border-[#2c1810] p-3 mb-2">
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="col-span-3">
          <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Nome Completo</p>
          <p className="text-base font-black uppercase">{doc.nome}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-gray-500">Nascimento</p>
          <p className="font-bold">{doc.dataNascimento ? new Date(doc.dataNascimento + 'T00:00').toLocaleDateString('pt-BR') : '—'}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-gray-500">Status</p>
          <p className="font-bold uppercase border border-black px-1 inline-block">{doc.status}</p>
        </div>
      </div>
    </div>

    <div className="border border-[#2c1810] p-3 mb-2">
      <p className="text-[9px] font-black uppercase text-[#2c1810] tracking-widest mb-2">Contato e Filiação</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="col-span-2">
          <p className="text-[9px] font-black uppercase text-gray-500">Responsável</p>
          <p className="font-bold uppercase">{doc.responsavel || '—'}</p>
        </div>
        <div><p className="text-[9px] font-black uppercase text-gray-500">Telefone</p><p className="font-bold">{doc.telefone || '—'}</p></div>
        <div><p className="text-[9px] font-black uppercase text-gray-500">E-mail</p><p className="font-bold">{doc.email || '—'}</p></div>
        <div className="col-span-2 pt-1 border-t border-gray-200">
          <p className="text-[9px] font-black uppercase text-gray-500">Endereço</p>
          <p className="uppercase">{doc.endereco}{doc.numero ? `, ${doc.numero}` : ''}{doc.bairro ? ` — ${doc.bairro}` : ''}</p>
        </div>
      </div>
    </div>

    <div className="border border-[#2c1810] p-3 mb-2">
      <p className="text-[9px] font-black uppercase text-[#2c1810] tracking-widest mb-2">Situação Sacramental</p>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {Object.entries(doc.sacramentos || {}).map(([key, s]: any) => (
          <div key={key} className={cn("p-2 border", s.recebido ? "border-[#2c1810] bg-gray-50" : "border-gray-200 opacity-60")}>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{key}</p>
            <p className="font-black uppercase text-xs">{s.recebido ? 'Sim' : 'Não'}</p>
            {s.recebido && <p className="text-[9px] font-bold">{s.data ? new Date(s.data + 'T00:00').toLocaleDateString('pt-BR') : ''}</p>}
          </div>
        ))}
      </div>
    </div>

    {(doc.necessidadeEspecial || doc.observacao) && (
      <div className="border border-[#2c1810] p-3 mb-2 text-xs">
        {doc.necessidadeEspecial && <p className="font-bold text-red-800 mb-1"><span className="font-black uppercase text-[9px] text-gray-500">Nec. Especiais: </span>{doc.necessidadeEspecial}</p>}
        {doc.observacao && <p className="font-serif italic"><span className="font-sans font-black uppercase text-[9px] not-italic text-gray-500">Obs.: </span>{doc.observacao}</p>}
      </div>
    )}

    <div className="mt-10 grid grid-cols-2 gap-12 font-bold text-[9px] uppercase tracking-widest text-center">
      <div className="pt-2 border-t border-[#2c1810]">Catequista Responsável</div>
      <div className="pt-2 border-t border-[#2c1810]">Assinatura do Responsável</div>
    </div>
  </div>
);



export const ParentsContactList = ({ org, turma, catequizandos }: any) => (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Relação de Responsáveis e Contatos" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <table className="w-full border-collapse border-2 border-[#2c1810]">
      <thead>
        <tr className="bg-[#2c1810] text-white">
          <th className="p-3 text-left text-xs font-black uppercase w-[30%] border-r border-white/20">Nome do Catequizando</th>
          <th className="p-3 text-left text-xs font-black uppercase w-[30%] border-r border-white/20">Responsável Legal</th>
          <th className="p-3 text-left text-xs font-black uppercase w-[20%] border-r border-white/20">Telefone</th>
          <th className="p-3 text-left text-xs font-black uppercase w-[20%]">E-mail</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any) => (
          <tr key={c.id} className="border-b border-gray-300">
            <td className="p-3 text-xs font-bold uppercase border-r border-[#2c1810]">{c.nome}</td>
            <td className="p-3 text-xs uppercase border-r border-[#2c1810]">{c.responsavel || "—"}</td>
            <td className="p-3 text-xs font-mono font-bold border-r border-[#2c1810]">{c.telefone || "—"}</td>
            <td className="p-3 text-xs lowercase">{c.email || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ==========================================
// ATIVIDADE TEMPLATES
// ==========================================

export const ActivityFullSheet = ({ doc, org, turma }: any) => (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Ficha de Planejamento de Evento" 
      subtitulo="Atividades Extracurriculares e Celebrações"
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#2c1810]"></div>
      <p className="text-xs font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Nome do Evento</p>
      <h2 className="text-3xl font-black uppercase mb-4 text-[#2c1810]">{doc.nome}</h2>
      
      <div className="grid grid-cols-2 gap-8 mt-6 border-t border-gray-200 pt-6 text-sm">
         <div>
           <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Data e Horário</p>
           <p className="font-bold text-lg">{formatarDataVigente(doc.data)} às {doc.horario || "--:--"}</p>
         </div>
         <div>
           <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Classificação</p>
           <p className="font-bold uppercase text-sm border border-black inline-block px-2 py-1">{doc.tipo} • {doc.modalidade}</p>
         </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="border border-[#2c1810] p-6 bg-gray-50"><p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Localização</p><p className="font-bold text-base uppercase">{doc.local}</p></div>
      <div className="border border-[#2c1810] p-6 bg-gray-50"><p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Condução / Transporte</p><p className="font-bold text-base uppercase">{doc.conducao || "Não Especificado"}</p></div>
    </div>

    <div className="space-y-8">
      <div className="border-t-2 border-[#2c1810] pt-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Descrição Detalhada do Evento</h3>
        <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap">{doc.descricao}</p>
      </div>
      
      {doc.observacao && (
        <div className="p-6 border border-dashed border-[#2c1810] bg-yellow-50/50">
          <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-yellow-900">Anotações Relevantes</p>
          <p className="text-sm font-serif italic text-[#2c1810]">{doc.observacao}</p>
        </div>
      )}
    </div>
  </div>
);

// ==========================================
// UNIFIED PLAN TEMPLATE
// ==========================================

export const UnifiedPlanSheet = ({ org, turma, items }: any) => (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Cronograma Geral da Turma" 
      subtitulo="Relação Integrada de Encontros e Atividades"
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <div className="space-y-10">
      {items.map(({ month, items: monthItems }: any) => (
        <div key={month} className="break-inside-avoid">
           <h3 className="text-sm font-serif font-black uppercase bg-[#2c1810] text-white px-6 py-2 inline-block mb-0 tracking-widest">{month}</h3>
           <table className="w-full border-collapse border-2 border-[#2c1810]">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-[#2c1810]">
                  <th className="border-r border-[#2c1810] p-3 text-center text-xs font-black uppercase w-24">Data</th>
                  <th className="border-r border-[#2c1810] p-3 text-center text-xs font-black uppercase w-32">Classificação</th>
                  <th className="border-r border-[#2c1810] p-3 text-left text-xs font-black uppercase">Tema / Título</th>
                  <th className="p-3 text-left text-xs font-black uppercase w-48">Local</th>
                </tr>
              </thead>
              <tbody>
                {monthItems.map((it: any, j: number) => (
                  <tr key={j} className="border-b border-gray-300">
                    <td className="border-r border-[#2c1810] p-3 text-center text-sm font-bold">{new Date(it.data + 'T00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</td>
                    <td className="border-r border-[#2c1810] p-3 text-center text-[10px] font-black uppercase tracking-widest">{it.type === 'encontro' ? 'Encontro' : 'Atividade'}</td>
                    <td className="border-r border-[#2c1810] p-3 text-sm font-bold uppercase">{it.tema || it.nome}</td>
                    <td className="p-3 text-xs uppercase">{it.local || 'Sala de Catequese'}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      ))}
    </div>
  </div>
);

export const AnnualCelebrationsCalendar = ({ org, turma, catequizandos }: any) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const grouped = months.map((monthName, monthIndex) => {
    const events: any[] = [];
    catequizandos.forEach((c: any) => {
      if (c.dataNascimento) {
        const d = new Date(c.dataNascimento + 'T12:00:00');
        if (d.getMonth() === monthIndex) {
          events.push({ day: d.getDate(), name: c.nome, type: 'Nascimento' });
        }
      }
      if (c.sacramentos?.batismo?.data) {
        const d = new Date(c.sacramentos.batismo.data + 'T12:00:00');
        if (d.getMonth() === monthIndex) {
          events.push({ day: d.getDate(), name: c.nome, type: 'Batismo' });
        }
      }
    });
    return { 
      name: monthName, 
      events: events.sort((a, b) => a.day - b.day) 
    };
  });

  return (
    <div className="p-8 text-black bg-white font-sans min-h-screen">
      <PrintHeader 
        titulo="Calendário Litúrgico e Festivo" 
        subtitulo="Registro Anual de Nascimentos e Aniversários de Batismo"
        paroquia={org.paroquia} 
        comunidade={org.comunidade}
        turma={turma.nome}
      />
      
      <div className="grid grid-cols-2 gap-x-12 gap-y-12 mt-8">
        {grouped.map((m) => (
          <div key={m.name} className="border-t-4 border-[#2c1810] pt-4 break-inside-avoid">
            <h3 className="text-lg font-serif font-black uppercase mb-4 text-[#2c1810] tracking-widest">{m.name}</h3>
            {m.events.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhuma celebração registrada</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {m.events.map((e, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 w-8 font-black text-right pr-4 border-r border-[#2c1810] text-[#2c1810]">{e.day}</td>
                      <td className="py-2 pl-4 font-bold uppercase">{e.name}</td>
                      <td className="py-2 text-right">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-1 border", 
                          e.type === 'Nascimento' ? "border-amber-500 text-amber-800 bg-amber-50" : "border-blue-500 text-blue-800 bg-blue-50"
                        )}>
                          {e.type === 'Nascimento' ? 'Aniv. Nasc.' : 'Aniv. Batismo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// REUNIÃO TEMPLATES
// ==========================================

export const ReuniaoFullSheet = ({ doc, org, turma, catequizandos }: any) => (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Ata Oficial de Reunião" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#2c1810]"></div>
      <p className="text-xs font-black uppercase text-gray-500 tracking-[0.2em] mb-2 font-serif">Natureza da Reunião</p>
      <h2 className="text-3xl font-black uppercase mb-4 text-[#2c1810]">{doc.tipo}</h2>
      
      <div className="grid grid-cols-2 gap-8 mt-6 border-t border-gray-200 pt-6 text-sm">
         <div>
           <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Data e Horário</p>
           <p className="font-bold text-lg">{formatarDataVigente(doc.data)} às {doc.horario || "--:--"}</p>
         </div>
         <div>
           <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Local</p>
           <p className="font-bold text-lg uppercase">{doc.local || "Sala de Catequese"}</p>
         </div>
      </div>
    </div>

    <div className="space-y-10">
      {doc.oracaoInicial && (
        <div className="p-6 border border-[#2c1810] bg-gray-50 italic">
          <p className="text-[10px] font-black uppercase text-gray-500 mb-2 not-italic tracking-widest font-sans">Oração Inicial</p>
          <p className="font-serif text-base">"{doc.oracaoInicial}"</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-serif font-black uppercase border-b-2 border-[#2c1810] pb-2 mb-6 tracking-widest text-[#2c1810]">Pautas e Deliberações</h3>
        
        {doc.servicosLiturgia && Object.values(doc.servicosLiturgia).some(v => v) && (
          <div className="mb-8 border-2 border-amber-900 p-6 bg-amber-50 break-inside-avoid relative">
            <h4 className="absolute -top-3 left-4 bg-amber-50 px-2 text-[10px] font-black uppercase tracking-widest text-amber-900">Distribuição de Serviços Litúrgicos</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-serif">
              {[
                { id: 'celebrante', label: 'Celebrante' },
                { id: 'animador', label: 'Animador' },
                { id: '1_leitor', label: '1º Leitor' },
                { id: 'salmista', label: 'Salmista' },
                { id: '2_leitor', label: '2º Leitor' },
                { id: 'preces', label: 'Preces' },
                { id: 'cantores', label: 'Cantores' },
              ].map(s => doc.servicosLiturgia[s.id] ? (
                <div key={s.id} className="border-b border-amber-200 pb-1">
                  <span className="font-black text-amber-950 uppercase text-xs font-sans tracking-widest block mb-1">{s.label}</span>
                  <span className="italic">{doc.servicosLiturgia[s.id]}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {doc.pautas && doc.pautas.length > 0 ? (
          <div className="space-y-6">
            {doc.pautas.map((p: any, i: number) => (
              <div key={i} className="border-l-4 border-[#2c1810] pl-6 py-2 break-inside-avoid">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-lg font-black font-serif text-[#2c1810]">{i+1}.</span>
                  <p className="text-base font-black uppercase text-[#2c1810]">{p.titulo}</p>
                  {p.tempo > 0 && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border px-2 py-0.5">{p.tempo} min</span>}
                </div>
                <p className="text-sm leading-relaxed text-gray-800 font-serif pl-8">{p.descricao}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 border border-gray-300 min-h-[150px] bg-gray-50">
            <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap">{doc.descricao}</p>
          </div>
        )}
      </div>

      <div className="break-inside-avoid">
        <h3 className="text-sm font-serif font-black uppercase border-b-2 border-[#2c1810] pb-2 mb-6 tracking-widest text-[#2c1810]">Registro de Presença</h3>
        <table className="w-full border-collapse border-2 border-[#2c1810]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-[#2c1810] text-[10px] font-black uppercase tracking-widest">
              <th className="border-r border-[#2c1810] p-2 w-12 text-center">Nº</th>
              <th className="border-r border-[#2c1810] p-2 text-left">Participante</th>
              <th className="border-r border-[#2c1810] p-2 w-24 text-center">Presente</th>
              <th className="border-r border-[#2c1810] p-2 w-24 text-center">Falta</th>
              <th className="p-2 text-left w-48">Assinatura / Rubrica</th>
            </tr>
          </thead>
          <tbody>
            {(doc.presenca || []).map((p: any, idx: number) => {
              const cat = catequizandos.find((c: any) => c.id === p.id);
              return (
                <tr key={idx} className="border-b border-gray-300 text-sm">
                  <td className="border-r border-[#2c1810] p-3 text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-[#2c1810] p-3 font-bold uppercase">{cat?.nome || "Participante"}</td>
                  <td className="border-r border-[#2c1810] p-3 text-center font-black text-xl text-emerald-800">{p.presente ? 'X' : ''}</td>
                  <td className="border-r border-[#2c1810] p-3 text-center font-black text-xl text-red-800">{!p.presente ? 'X' : ''}</td>
                  <td className="p-3"></td>
                </tr>
              );
            })}
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={`blank-${i}`} className="h-10 border-b border-gray-300">
                <td className="border-r border-[#2c1810]"></td>
                <td className="border-r border-[#2c1810]"></td>
                <td className="border-r border-[#2c1810]"></td>
                <td className="border-r border-[#2c1810]"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {doc.observacao && (
        <div className="p-6 border border-dashed border-[#2c1810] bg-gray-50 break-inside-avoid">
          <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-gray-500">Observações Finais</p>
          <p className="text-sm font-serif italic text-gray-800">{doc.observacao}</p>
        </div>
      )}
    </div>
  </div>
);
