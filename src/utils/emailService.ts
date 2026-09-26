import { supabase } from '../supabaseClient';

const invokeEmailFunction = async (payload: Record<string, unknown>): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-auth-email', {
      body: payload,
    });

    if (error) {
      console.error('Erreur lors de l’envoi de l’email Folio Dev :', error);
    }
  } catch (error) {
    console.error('Erreur inattendue lors de l’envoi de l’email Folio Dev :', error);
  }
};

export const sendWelcomeEmail = (userEmail: string, userName = ''): void => {
  if (!userEmail) return;

  void invokeEmailFunction({
    type: 'welcome',
    email: userEmail,
    name: userName,
  });
};

export const sendLoginEmail = (userEmail: string, userName = '', loginTime: Date): void => {
  if (!userEmail) return;

  void invokeEmailFunction({
    type: 'login',
    email: userEmail,
    name: userName,
    loginTime: loginTime.toISOString(),
  });
};
