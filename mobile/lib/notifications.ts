/**
 * Push notification setup using expo-notifications patterns
 * Gracefully handles missing dependency
 */

import { Platform, Alert } from 'react-native';

// Notification helper — wraps expo-notifications
// Will work when expo-notifications is installed

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications not installed — functions become no-ops
}

/**
 * Register for push notifications
 * Returns the Expo push token if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) {
    console.warn('expo-notifications not installed');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative as notificações para receber alertas sobre planos gerados.'
      );
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Error registering for push:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds: number = 0
) {
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger:
        delaySeconds > 0
          ? { seconds: delaySeconds, type: 'time' }
          : { type: 'dateTime', seconds: 0 },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

/**
 * Notification for plan generation complete
 */
export async function notifyPlanReady(studentName: string) {
  await scheduleLocalNotification(
    'Plano Pronto! ✅',
    `O plano de treino de ${studentName} foi gerado com sucesso.`
  );
}

/**
 * Notification for plan generation error
 */
export async function notifyPlanError(studentName: string) {
  await scheduleLocalNotification(
    'Erro na Geração ❌',
    `Houve um erro ao gerar o plano de ${studentName}. Tente novamente.`
  );
}

/**
 * Notification for session reminder
 */
export async function notifySessionReminder(
  studentName: string,
  sessionName: string
) {
  await scheduleLocalNotification(
    'Lembrete de Sessão 🏋️',
    `${studentName} tem a sessão "${sessionName}" agora.`
  );
}

/**
 * Notification for progress milestone
 */
export async function notifyProgressMilestone(studentName: string, milestone: string) {
  await scheduleLocalNotification(
    'Parabéns! 🎉',
    `${studentName} alcançou o objetivo: ${milestone}`
  );
}

/**
 * Setup notification handlers
 * Call this in your app entry point
 */
export function setupNotificationHandlers(
  onReceived?: (notification: any) => void,
  onTapped?: (notification: any) => void
) {
  if (!Notifications) return;

  try {
    // Handle notifications received while app is open
    if (onReceived) {
      const subscription = Notifications.addNotificationReceivedListener(
        onReceived
      );
      return () => subscription.remove();
    }

    // Handle notification tap
    if (onTapped) {
      const subscription =
        Notifications.addNotificationResponseReceivedListener((response: any) => {
          onTapped(response.notification);
        });
      return () => subscription.remove();
    }
  } catch (error) {
    console.error('Error setting up notification handlers:', error);
  }
}
