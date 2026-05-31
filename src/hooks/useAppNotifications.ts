import { useEffect } from 'react';
import { useEncontros, useCatequizandos, useReunioes, useTurmas } from './useSupabaseData';
import { isToday, isTomorrow, parseISO, format, setHours, setMinutes, isAfter, isBefore } from 'date-fns';

export function useAppNotifications() {
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: reunioes = [] } = useReunioes();

  useEffect(() => {
    // Apenas rodar as checagens se o ServiceWorker e a API de Notificações estiverem disponíveis
    if (!('Notification' in window) || !('serviceWorker' in navigator) || Notification.permission !== 'granted') {
      return;
    }

    const checkAndNotify = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Verifica as preferências do usuário no menu de configurações
        // (Por padrão ligamos se não existir o registro)
        const birthdaysEnabled = localStorage.getItem('ivc_birthdays_enabled') !== 'false';
        const meetingsEnabled = localStorage.getItem('ivc_meetings_enabled') !== 'false';
        const reunioesEnabled = localStorage.getItem('ivc_reunioes_enabled') !== 'false';

        // Pega as notificações já exibidas hoje
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const shownRaw = localStorage.getItem('ivc_notifications_shown');
        let shownData = shownRaw ? JSON.parse(shownRaw) : {};
        if (shownData.date !== todayKey) {
          shownData = { date: todayKey, ids: [] };
        }

        const now = new Date();
        const notificationTimeToday = setMinutes(setHours(new Date(), 7), 0); // 07:00 de hoje
        const isPast7AM = isAfter(now, notificationTimeToday);

        if (!isPast7AM) return; // Se for antes das 7h, não exibe as notificações diárias

        const notificationsQueue: { id: string, title: string, body: string, url: string }[] = [];

        // 1. CHECAR ANIVERSÁRIOS
        if (birthdaysEnabled) {
          catequizandos.forEach(cat => {
            if (!cat.data_nascimento || cat.status !== 'ativo') return;
            const bd = new Date(cat.data_nascimento);
            // Corrige fuso e ano para comparar mês/dia
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            const isBdToday = bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
            const isBdTomorrow = bd.getDate() === tomorrow.getDate() && bd.getMonth() === tomorrow.getMonth();

            const turma = turmas.find(t => t.id === cat.turma_id);
            const turmaNome = turma ? turma.nome : 'Sua Turma';

            if (isBdToday) {
              const id = `bd-today-${cat.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Aniversário Hoje! 🎉',
                  body: `Hoje é aniversário de ${cat.nome} (${turmaNome})`,
                  url: `/turmas/${cat.turma_id}/catequizandos`
                });
              }
            } else if (isBdTomorrow) {
              const id = `bd-tomorrow-${cat.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Aniversário Amanhã! 🎂',
                  body: `Amanhã é aniversário de ${cat.nome} (${turmaNome})`,
                  url: `/turmas/${cat.turma_id}/catequizandos`
                });
              }
            }
          });
        }

        // 2. CHECAR ENCONTROS
        if (meetingsEnabled) {
          encontros.forEach(enc => {
            if (!enc.data || enc.status !== 'previsto') return;
            const dataEnc = parseISO(enc.data);
            
            const isEncToday = isToday(dataEnc);
            const isEncTomorrow = isTomorrow(dataEnc);
            const turma = turmas.find(t => t.id === enc.turma_id);
            const turmaNome = turma ? turma.nome : 'Sua Turma';

            if (isEncToday) {
              const id = `enc-today-${enc.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Encontro Hoje! 📖',
                  body: `Hoje tem encontro: ${enc.tema} (${turmaNome})`,
                  url: `/turmas/${enc.turma_id}/encontros/${enc.id}`
                });
              }
            } else if (isEncTomorrow) {
              const id = `enc-tomorrow-${enc.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Encontro Amanhã! ⏳',
                  body: `Amanhã tem encontro: ${enc.tema} (${turmaNome})`,
                  url: `/turmas/${enc.turma_id}/encontros/${enc.id}`
                });
              }
            }
          });
        }

        // 3. CHECAR REUNIÕES
        if (reunioesEnabled) {
          reunioes.forEach(reu => {
            if (!reu.data || reu.status !== 'agendada') return;
            const dataReu = parseISO(reu.data);
            
            const isReuToday = isToday(dataReu);
            const isReuTomorrow = isTomorrow(dataReu);
            const turma = turmas.find(t => t.id === reu.turma_id);
            const turmaNome = turma ? turma.nome : 'Sua Turma';

            if (isReuToday) {
              const id = `reu-today-${reu.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Reunião Hoje! 👥',
                  body: `Reunião: ${reu.tema} (${turmaNome})`,
                  url: `/turmas/${reu.turma_id}/reunioes`
                });
              }
            } else if (isReuTomorrow) {
              const id = `reu-tomorrow-${reu.id}`;
              if (!shownData.ids.includes(id)) {
                notificationsQueue.push({
                  id,
                  title: 'Reunião Amanhã! 🗓️',
                  body: `Amanhã tem reunião: ${reu.tema} (${turmaNome})`,
                  url: `/turmas/${reu.turma_id}/reunioes`
                });
              }
            }
          });
        }

        // Disparar notificações
        for (const notif of notificationsQueue) {
          await registration.showNotification(notif.title, {
            body: notif.body,
            icon: '/icon-192.png',
            badge: '/badge.png',
            data: { url: notif.url },
            tag: notif.id // Evita mostrar a mesma múltiplas vezes no OS
          });
          shownData.ids.push(notif.id);
        }

        // Atualizar cache de exibidas
        if (notificationsQueue.length > 0) {
          localStorage.setItem('ivc_notifications_shown', JSON.stringify(shownData));
        }

      } catch (err) {
        console.error('Erro ao processar notificações do app', err);
      }
    };

    // Apenas aguarda os dados carregarem para rodar
    if (turmas.length > 0) {
      checkAndNotify();
    }

  }, [turmas, encontros, catequizandos, reunioes]);

}
