import { cn, formatarDataVigente } from "@/lib/utils";
import { Encontro, Catequizando, Atividade, Turma } from "@/lib/store";
import { BookOpen, Calendar, Clock, Cross, User, Users } from "lucide-react";

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  paroquia?: string;
  comunidade?: string;
  turma?: string;
  etapa?: string;
}

const PrintHeader = ({ titulo, subtitulo, paroquia, comunidade, turma, etapa }: HeaderProps) => (
  <div className="border-b-[3px] border-[#8B4513] pb-4 mb-6 text-center space-y-1">
    <div className="flex justify-center mb-2">
      <div className="w-12 h-12 rounded-full border-2 border-[#8B4513] shadow-inner flex items-center justify-center bg-gradient-to-br from-[#f5e6d3] to-[#faf0e6]">
        <Cross className="h-6 w-6 text-[#8B4513]" />
      </div>
    </div>
    <h1 className="text-2xl font-black uppercase tracking-tight text-[#5c3317]">{titulo}</h1>
    {subtitulo && <p className="text-sm italic font-serif text-[#8B4513]">{subtitulo}</p>}
    <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest pt-2 text-[#5c3317]">
      {paroquia && <span>Paróquia: {paroquia}</span>}
      {comunidade && <span>Comunidade: {comunidade}</span>}
    </div>
    <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase opacity-70 text-[#8B4513]">
      {turma && <span>Turma: {turma}</span>}
      {etapa && <span>Etapa: {etapa}</span>}
      <span>Data de Impressão: {new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  </div>
);

// ==========================================
// ENCONTRO TEMPLATES
// ==========================================

export const EncontroFullSheet = ({ doc, org, turma }: any) => (
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Ficha Técnica do Encontro" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
      etapa={turma.etapa}
    />
    
    <div className="p-6 border-2 border-black rounded-xl mb-6 bg-gray-50">
      <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Tema do Encontro</p>
      <h2 className="text-2xl font-black">{doc.tema}</h2>
      {doc.leituraBiblica && (
        <p className="mt-4 font-serif italic text-lg border-l-4 border-gray-400 pl-4 py-1">
          Bíblia: {doc.leituraBiblica}
        </p>
      )}
      <div className="flex gap-4 mt-4 text-xs font-bold uppercase">
        <span>Data: {formatarDataVigente(doc.data)}</span>
        <span>Duração: {doc.roteiro?.reduce((s: number, r: any) => s + (r.tempo || 0), 0) || 0} min</span>
      </div>
    </div>

    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black uppercase border-b-2 border-black pb-1 mb-3 tracking-widest">Roteiro e Desenvolvimento</h3>
        <div className="space-y-4">
          {doc.roteiro?.map((r: any, i: number) => (
            <div key={i} className="flex gap-4 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">{i+1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-black uppercase text-xs">{r.label}</p>
                  <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded uppercase">{r.tempo} min</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{r.conteudo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {doc.materialApoio && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Material de Apoio</h4>
          <p className="text-sm">{doc.materialApoio}</p>
        </div>
      )}

      {doc.avaliacao && (
        <div className="p-4 border border-black/10 rounded-lg space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest border-b pb-1">Avaliação Pós-Encontro</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><p className="font-bold text-gray-500">Pontos Positivos</p><p>{doc.avaliacao.pontosPositivos || "—"}</p></div>
            <div><p className="font-bold text-gray-500">A Melhorar</p><p>{doc.avaliacao.pontosMelhorar || "—"}</p></div>
            <div className="col-span-2"><p className="font-bold text-gray-500">Conclusão</p><p>{doc.avaliacao.conclusao || "—"}</p></div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const AttendanceBlankSheet = ({ doc, org, turma, catequizandos }: any) => (
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Lista de Presença (Encontro)" 
      subtitulo={doc ? `Encontro: ${doc.tema} - ${formatarDataVigente(doc.data)}` : "Ficha de Presença em Branco"}
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <table className="w-full border-collapse border-2 border-black">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black p-2 w-10 text-[10px] font-black">#</th>
          <th className="border border-black p-2 text-left text-[10px] font-black">CATEQUIZANDO</th>
          <th className="border border-black p-2 w-32 text-[10px] font-black">STATUS / RUBRICA</th>
          <th className="border border-black p-2 text-left text-[10px] font-black">OBSERVAÇÕES</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').map((c: any, i: number) => (
          <tr key={c.id}>
            <td className="border border-black p-2 text-center text-xs">{i+1}</td>
            <td className="border border-black p-2 text-sm font-bold">{c.nome}</td>
            <td className="border border-black p-2"></td>
            <td className="border border-black p-2"></td>
          </tr>
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <tr key={`blank-${i}`}>
            <td className="border border-black p-4"></td>
            <td className="border border-black p-4"></td>
            <td className="border border-black p-4"></td>
            <td className="border border-black p-4"></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SemesterAttendanceSheet = ({ org, turma, catequizandos }: any) => (
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Grade de Frequência Semestral" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
      etapa={turma.etapa}
    />
    <p className="text-[10px] font-bold uppercase mb-2 text-center">Registro de Presenças por Encontro</p>
    <table className="w-full border-collapse border border-black text-[9px]">
      <thead>
        <tr className="bg-gray-100 italic">
          <th className="border border-black p-1 w-6">#</th>
          <th className="border border-black p-1 text-left">NOME DO CATEQUIZANDO</th>
          {Array.from({ length: 20 }).map((_, i) => (
            <th key={i} className="border border-black p-1 w-7">{i+1}</th>
          ))}
          <th className="border border-black p-1 w-8">FALTAS</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any, i: number) => (
          <tr key={c.id}>
            <td className="border border-black p-1 text-center font-bold">{i+1}</td>
            <td className="border border-black p-1 font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{c.nome}</td>
            {Array.from({ length: 20 }).map((_, j) => (
              <td key={j} className="border border-black p-1"></td>
            ))}
            <td className="border border-black p-1 bg-gray-50"></td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-4 grid grid-cols-2 gap-8 text-[8px] font-bold uppercase tracking-widest text-gray-500">
      <p>P: Presente | F: Falta | J: Justificada</p>
      <p className="text-right">Semestre: ________ / ________</p>
    </div>
  </div>
);

// ==========================================
// CATEQUIZANDO TEMPLATES
// ==========================================

export const CatequizandoIndividualSheet = ({ doc, org, turma }: any) => (
  <div className="p-10 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Ficha Cadastral do Catequizando" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    
    <div className="flex gap-8 mb-8">
      <div className="w-32 h-40 border-2 border-black flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
        {doc.foto ? <img src={doc.foto} className="w-full h-full object-cover" /> : <User className="h-12 w-12 text-gray-300" />}
      </div>
      <div className="flex-1 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Nome Completo</p>
          <p className="text-xl font-black">{doc.nome}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">D. Nascimento</p><p className="font-bold">{doc.dataNascimento ? new Date(doc.dataNascimento + 'T00:00').toLocaleDateString('pt-BR') : '—'}</p></div>
          <div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p><p className="font-bold uppercase text-xs">{doc.status}</p></div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 border-t pt-6">
      <div className="col-span-2">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Filiação / Responsável</p>
        <p className="text-lg font-black">{doc.responsavel || "—"}</p>
        <div className="flex gap-4 mt-2 text-sm font-bold">
           <span>{doc.telefone}</span>
           <span>{doc.email}</span>
        </div>
      </div>
      <div className="col-span-2">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Endereço Residencial</p>
        <p className="text-sm font-bold">
          {doc.endereco}{doc.numero ? `, ${doc.numero}` : ""}{doc.bairro ? ` - ${doc.bairro}` : ""}
          {doc.complemento ? ` (${doc.complemento})` : ""}
        </p>
      </div>
    </div>

    <div className="mb-8">
       <h3 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-4 tracking-tighter">Situação Sacramental</h3>
       <div className="grid grid-cols-3 gap-4">
          {Object.entries(doc.sacramentos || {}).map(([key, s]: any) => (
            <div key={key} className={cn("p-4 border-2 rounded-xl text-center", s.recebido ? "bg-gray-100 border-black" : "border-gray-200 opacity-60")}>
              <p className="text-[10px] font-black uppercase mb-1">{key}</p>
              <p className="text-sm font-black">{s.recebido ? "SIM" : "NÃO"}</p>
              <p className="text-[9px] mt-1 italic">{s.data ? new Date(s.data + 'T00:00').toLocaleDateString('pt-BR') : ''}</p>
              <p className="text-[9px] font-bold">{s.paroquia}</p>
            </div>
          ))}
       </div>
    </div>

    <div className="space-y-4">
       {doc.necessidadeEspecial && (
         <div className="p-4 border-l-4 border-black bg-gray-50">
           <p className="text-[10px] font-black uppercase mb-1">Necessidades Especiais</p>
           <p className="text-sm">{doc.necessidadeEspecial}</p>
         </div>
       )}
       {doc.observacao && (
         <div className="p-4 border-l-4 border-gray-300">
           <p className="text-[10px] font-black uppercase mb-1">Observações Gerais</p>
           <p className="text-sm italic">{doc.observacao}</p>
         </div>
       )}
    </div>

    <div className="mt-24 grid grid-cols-2 gap-12 font-bold text-xs">
       <div className="text-center pt-2 border-t border-black">Assinatura do Catequista</div>
       <div className="text-center pt-2 border-t border-black">Assinatura do Responsável</div>
    </div>
  </div>
);

export const ParentsContactList = ({ org, turma, catequizandos }: any) => (
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Relação de Responsáveis e Contatos" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <table className="w-full border-collapse border-b border-black">
      <thead>
        <tr className="bg-gray-900 text-white">
          <th className="p-2 text-left text-[10px] font-black uppercase w-[25%] border-r border-white/20">CATEQUIZANDO</th>
          <th className="p-2 text-left text-[10px] font-black uppercase w-[25%] border-r border-white/20">RESPONSÁVEL</th>
          <th className="p-2 text-left text-[10px] font-black uppercase w-[20%] border-r border-white/20">TELEFONE</th>
          <th className="p-2 text-left text-[10px] font-black uppercase w-[30%]">EMAIL</th>
        </tr>
      </thead>
      <tbody>
        {catequizandos.filter((c:any) => c.status === 'ativo').sort((a:any, b:any) => a.nome.localeCompare(b.nome)).map((c: any) => (
          <tr key={c.id} className="border-b border-gray-200">
            <td className="p-2 text-[11px] font-black border-r">{c.nome}</td>
            <td className="p-2 text-[11px] border-r">{c.responsavel || "—"}</td>
            <td className="p-2 text-[11px] font-mono border-r">{c.telefone || "—"}</td>
            <td className="p-2 text-[10px] lowercase">{c.email || "—"}</td>
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
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Ficha Técnica da Atividade/Evento" 
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <div className="p-6 border-2 border-black rounded-3xl mb-8 bg-gray-50 flex justify-between items-center">
      <div>
        <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Nome da Atividade</p>
        <h2 className="text-3xl font-black">{doc.nome}</h2>
        <p className="text-sm font-bold uppercase mt-1 text-gray-600">Tipo: {doc.tipo} • Modalidade: {doc.modalidade}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black">{formatarDataVigente(doc.data)}</p>
        <p className="text-sm font-bold uppercase">{doc.horario || "--:--"}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div className="space-y-1"><p className="text-[10px] font-black uppercase gray-500">Local do Evento</p><p className="font-bold text-lg">{doc.local}</p></div>
      <div className="space-y-1"><p className="text-[10px] font-black uppercase gray-500">Condução / Transporte</p><p className="font-bold text-lg">{doc.conducao || "Não especificado"}</p></div>
    </div>
    <div className="space-y-6">
      <div><h3 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-3">Descrição Detalhada</h3><p className="text-sm leading-relaxed whitespace-pre-wrap">{doc.descricao}</p></div>
      {doc.observacao && (
        <div className="p-4 border border-dashed border-black/30 rounded-xl">
          <p className="text-[10px] font-black uppercase mb-1">Anotações e Observações</p>
          <p className="text-xs italic">{doc.observacao}</p>
        </div>
      )}
    </div>
  </div>
);

// ==========================================
// UNIFIED PLAN TEMPLATE
// ==========================================

export const UnifiedPlanSheet = ({ org, turma, items }: any) => (
  <div className="p-8 text-black font-sans print:p-0">
    <PrintHeader 
      titulo="Cronograma Geral de Atividades" 
      subtitulo="Encontros, Eventos e Celebrações"
      paroquia={org.paroquia} 
      comunidade={org.comunidade}
      turma={turma.nome}
    />
    <div className="space-y-8">
      {items.map(({ month, items: monthItems }: any) => (
        <div key={month} className="space-y-2">
           <h3 className="text-sm font-black uppercase bg-black text-white px-4 py-1 inline-block">{month}</h3>
           <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-left text-[10px] font-black w-20">DATA</th>
                  <th className="border border-black p-2 text-left text-[10px] font-black w-24">TIPO</th>
                  <th className="border border-black p-2 text-left text-[10px] font-black">DESCRIÇÃO / TEMA</th>
                  <th className="border border-black p-2 text-left text-[10px] font-black w-32">LOCAL</th>
                </tr>
              </thead>
              <tbody>
                {monthItems.map((it: any, j: number) => (
                  <tr key={j}>
                    <td className="border border-black p-2 text-xs font-bold">{new Date(it.data + 'T00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</td>
                    <td className="border border-black p-2 text-[9px] font-black uppercase">{it.type === 'encontro' ? 'Encontro' : 'Atividade'}</td>
                    <td className="border border-black p-2 text-xs font-bold">{it.tema || it.nome}</td>
                    <td className="border border-black p-2 text-xs">{it.local || 'Sala de Catequese'}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      ))}
    </div>
  </div>
);
