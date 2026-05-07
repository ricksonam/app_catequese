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
  <div className="border-b-[3px] border-[#2c1810] pb-6 mb-8 text-center space-y-2">
    <div className="flex justify-center mb-4">
      <div className="w-14 h-14 rounded-full border-[3px] border-[#2c1810] flex items-center justify-center bg-white shadow-sm">
        <Cross className="h-8 w-8 text-[#2c1810]" />
      </div>
    </div>
    <h1 className="text-3xl font-serif font-black uppercase tracking-tight text-[#2c1810]">{titulo}</h1>
    {subtitulo && <p className="text-base italic font-serif text-[#4a2e1b]">{subtitulo}</p>}
    
    <div className="flex items-center justify-center gap-6 text-sm font-bold uppercase tracking-widest pt-4 text-[#2c1810] font-sans">
      {paroquia && <span>Paróquia: {paroquia}</span>}
      {comunidade && <span>Comunidade: {comunidade}</span>}
    </div>
    
    <div className="flex items-center justify-center gap-6 text-xs font-bold uppercase text-[#4a2e1b] font-sans mt-2">
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
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Ficha Técnica de Encontro" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
      etapa={turma.etapa}
    />
    
    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#2c1810]"></div>
      <p className="text-xs font-black uppercase text-gray-500 tracking-[0.2em] mb-2 font-serif">Tema Principal do Encontro</p>
      <h2 className="text-3xl font-black uppercase mb-4 text-[#2c1810]">{doc.tema}</h2>
      
      {doc.leituraBiblica && (
        <div className="mt-6 border-l-4 border-[#2c1810] pl-6 py-2 bg-gray-50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Base Bíblica</p>
          <p className="font-serif italic text-xl text-[#2c1810]">"{doc.leituraBiblica}"</p>
        </div>
      )}
      
      <div className="flex gap-12 mt-8 pt-6 border-t border-gray-200 text-sm font-bold uppercase tracking-widest text-gray-600">
        <span className="flex items-center gap-2">Data Realização: <span className="text-black">{formatarDataVigente(doc.data)}</span></span>
        <span className="flex items-center gap-2">Duração Estimada: <span className="text-black">{doc.roteiro?.reduce((s: number, r: any) => s + (r.tempo || 0), 0) || 0} min</span></span>
      </div>
    </div>

    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-serif font-black uppercase border-b-[2px] border-[#2c1810] pb-2 mb-6 tracking-widest text-[#2c1810]">Roteiro e Desenvolvimento</h3>
        <div className="space-y-6">
          {doc.roteiro?.map((r: any, i: number) => (
            <div key={i} className="flex gap-6 border-b border-gray-200 pb-6 break-inside-avoid">
              <span className="w-10 h-10 rounded-full border-2 border-[#2c1810] text-[#2c1810] flex items-center justify-center font-black text-sm shrink-0">{i+1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <p className="font-black uppercase text-sm text-[#2c1810]">{r.label}</p>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 border border-gray-300 px-2 py-1">{r.tempo} min</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">{r.conteudo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {doc.materialApoio && (
        <div className="p-6 border border-[#2c1810] bg-gray-50 break-inside-avoid">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-3 border-b border-gray-300 pb-2">Material de Apoio e Preparação</h4>
          <p className="text-sm font-serif leading-relaxed">{doc.materialApoio}</p>
        </div>
      )}

      {doc.avaliacao && (
        <div className="p-6 border-2 border-[#2c1810] break-inside-avoid relative">
          <h4 className="text-sm font-black uppercase tracking-widest border-b-2 border-[#2c1810] pb-2 mb-4 text-[#2c1810]">Avaliação Pós-Encontro</h4>
          <div className="grid grid-cols-2 gap-8 text-sm font-serif">
            <div><p className="font-sans font-bold text-gray-500 uppercase text-xs mb-1 tracking-widest">Pontos Positivos</p><p className="italic">{doc.avaliacao.pontosPositivos || "—"}</p></div>
            <div><p className="font-sans font-bold text-gray-500 uppercase text-xs mb-1 tracking-widest">A Melhorar</p><p className="italic">{doc.avaliacao.pontosMelhorar || "—"}</p></div>
            <div className="col-span-2 pt-4 border-t border-gray-200"><p className="font-sans font-bold text-gray-500 uppercase text-xs mb-1 tracking-widest">Conclusão</p><p className="italic font-bold">{doc.avaliacao.conclusao || "—"}</p></div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const AttendanceBlankSheet = ({ doc, org, turma, catequizandos }: any) => (
  <div className="p-8 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Diário de Classe: Registro de Frequência" 
      subtitulo={doc ? `Referência: ${doc.tema} - ${formatarDataVigente(doc.data)}` : "Ficha de Presença em Branco para uso em sala"}
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <table className="w-full border-collapse border-2 border-[#2c1810]">
      <thead>
        <tr className="bg-gray-100 border-b-2 border-[#2c1810]">
          <th className="border border-[#2c1810] p-3 w-12 text-xs font-black uppercase text-center">Nº</th>
          <th className="border border-[#2c1810] p-3 text-left text-xs font-black uppercase">Nome do Catequizando</th>
          <th className="border border-[#2c1810] p-3 w-40 text-xs font-black uppercase text-center">Presença</th>
          <th className="border border-[#2c1810] p-3 text-left text-xs font-black uppercase w-48">Assinatura / Rubrica</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any, i: number) => (
          <tr key={c.id} className="border-b border-gray-300">
            <td className="border-r border-[#2c1810] p-3 text-center text-xs font-bold">{i+1}</td>
            <td className="border-r border-[#2c1810] p-3 text-sm font-bold uppercase">{c.nome}</td>
            <td className="border-r border-[#2c1810] p-3"></td>
            <td className="p-3"></td>
          </tr>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={`blank-${i}`} className="h-12 border-b border-gray-300">
            <td className="border-r border-[#2c1810]"></td>
            <td className="border-r border-[#2c1810]"></td>
            <td className="border-r border-[#2c1810]"></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
    
    <div className="mt-6 flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
      <p>Legenda: ( P ) Presente • ( F ) Falta • ( J ) Justificada</p>
      <p>Catequista Responsável: _________________________________________</p>
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
  <div className="p-10 text-black bg-white font-sans min-h-screen">
    <PrintHeader 
      titulo="Ficha Cadastral de Catequizando" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative break-inside-avoid">
       <h3 className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-[#2c1810]">Dados Pessoais</h3>
       <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Nome Completo</p>
            <p className="text-2xl font-black uppercase">{doc.nome}</p>
          </div>
          <div className="col-span-4">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Nascimento</p>
            <p className="font-bold">{doc.dataNascimento ? new Date(doc.dataNascimento + 'T00:00').toLocaleDateString('pt-BR') : '—'}</p>
          </div>
          <div className="col-span-4">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Status na Turma</p>
            <p className="font-bold uppercase text-xs p-1 px-2 border border-black inline-block">{doc.status}</p>
          </div>
       </div>
    </div>

    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative break-inside-avoid">
       <h3 className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-[#2c1810]">Contato e Filiação</h3>
       <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="col-span-2">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Responsável Principal / Filiação</p>
            <p className="text-xl font-bold uppercase">{doc.responsavel || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Telefone / WhatsApp</p>
            <p className="text-base font-bold">{doc.telefone || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">E-mail</p>
            <p className="text-base font-bold">{doc.email || "—"}</p>
          </div>
          <div className="col-span-2 pt-4 border-t border-gray-200">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Endereço Residencial</p>
            <p className="text-base uppercase">
              {doc.endereco}{doc.numero ? `, ${doc.numero}` : ""}{doc.bairro ? ` - Bairro ${doc.bairro}` : ""}
              {doc.complemento ? ` (${doc.complemento})` : ""}
            </p>
          </div>
       </div>
    </div>

    <div className="border-2 border-[#2c1810] p-8 mb-8 bg-white relative break-inside-avoid">
       <h3 className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-[#2c1810]">Situação Sacramental</h3>
       <div className="grid grid-cols-3 gap-6 text-center">
          {Object.entries(doc.sacramentos || {}).map(([key, s]: any) => (
            <div key={key} className={cn("p-4 border", s.recebido ? "border-[#2c1810] bg-gray-50" : "border-gray-300 opacity-60")}>
              <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-gray-600">{key}</p>
              <p className="text-lg font-black uppercase">{s.recebido ? "Recebeu" : "Não Recebeu"}</p>
              {s.recebido && (
                <>
                  <p className="text-xs mt-2 font-bold">{s.data ? new Date(s.data + 'T00:00').toLocaleDateString('pt-BR') : ''}</p>
                  <p className="text-[10px] mt-1 uppercase text-gray-600">{s.paroquia}</p>
                </>
              )}
            </div>
          ))}
       </div>
    </div>

    <div className="space-y-6 break-inside-avoid">
       {doc.necessidadeEspecial && (
         <div className="p-6 border-l-4 border-red-800 bg-red-50">
           <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-red-900">Atenção: Necessidades Especiais</p>
           <p className="text-sm font-bold uppercase text-red-950">{doc.necessidadeEspecial}</p>
         </div>
       )}
       {doc.observacao && (
         <div className="p-6 border border-gray-300 bg-gray-50">
           <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-gray-500">Observações Gerais</p>
           <p className="text-sm font-serif italic">{doc.observacao}</p>
         </div>
       )}
    </div>

    <div className="mt-32 grid grid-cols-2 gap-16 font-bold text-xs uppercase tracking-widest text-center">
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
