import React from 'react';
import { ArrowLeft, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapaTimeline } from '@/components/MapaTimeline';

export default function MapaPanoramico() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(-1)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black" />
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

      {/* Timeline Components */}
      <MapaTimeline />
    </div>
  );
}
