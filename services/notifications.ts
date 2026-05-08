import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isWeb } from '@/lib/platform';

/**
 * Notificações locais de rega. Mobile-only — no web seria possível com
 * a API Notifications do navegador, mas o usuário-alvo do feature
 * (idosos cuidando de plantas) usa quase 100% no celular, e expor
 * notificações persistentes no web pode ser estranho. Mantemos no-op
 * no web pra simplificar.
 *
 * As notificações são puramente locais — não precisam de backend nem
 * de FCM/APNs. O sistema operacional dispara no horário agendado.
 */

let setupDone = false;

/**
 * Configura o handler global e o canal de Android. Idempotente.
 * Chame uma vez no boot do app (ver app/_layout.tsx).
 */
export async function setupNotifications(): Promise<void> {
  if (isWeb || setupDone) return;
  setupDone = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Android exige um canal específico pra notificações com "importance".
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('watering', {
        name: 'Lembretes de rega',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D5F3F',
      });
    } catch (err) {
      console.warn('[notifications] channel setup failed:', err);
    }
  }
}

/** Pede permissão pro usuário. Retorna true se concedida. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (err) {
    console.warn('[notifications] permission request failed:', err);
    return false;
  }
}

/** True se permissão já foi concedida (sem pedir de novo). */
export async function hasNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  try {
    const result = await Notifications.getPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

/**
 * Agenda um lembrete de rega no horário especificado. Retorna o ID da
 * notificação (use pra cancelar depois). Se a permissão não estiver
 * concedida ou o horário já passou, retorna null silenciosamente —
 * o usuário verá o status "atrasada" no app mesmo sem notificação.
 */
export async function schedulePlantWatering(
  nickname: string,
  when: Date,
): Promise<string | null> {
  if (isWeb) return null;
  if (when.getTime() <= Date.now()) return null;
  const granted = await hasNotificationPermission();
  if (!granted) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de regar 💧',
        body: `${nickname} está pedindo água.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: 'watering',
      },
    });
  } catch (err) {
    console.warn('[notifications] schedule failed:', err);
    return null;
  }
}

/** Cancela um agendamento pelo ID. Silencioso se já foi disparado. */
export async function cancelPlantWatering(id: string | null): Promise<void> {
  if (isWeb || !id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.warn('[notifications] cancel failed:', err);
  }
}
