import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { sendLoginEmail, sendWelcomeEmail } from '../utils/emailService';

const getUserName = (user: { user_metadata?: Record<string, unknown> }) => {
  const metadata = user.user_metadata || {};
  return String(metadata.full_name || metadata.name || metadata.user_name || '').trim();
};

export const useAuthListener = (): void => {
  useEffect(() => {
    let active = true;
    const handledEvents = new Set<string>();

    const handleAuthEvent = (event: string, session: { access_token?: string; user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null } | null) => {
      const user = session?.user;
      if (!active || !user?.email || (event !== 'SIGNED_UP' && event !== 'SIGNED_IN')) return;

      const eventKey = event === 'SIGNED_IN'
        ? `${event}:${user.id}:${session?.access_token || Date.now()}`
        : `${event}:${user.id}`;
      if (handledEvents.has(eventKey)) return;
      handledEvents.add(eventKey);

      window.setTimeout(() => {
        void (async () => {
          if (event === 'SIGNED_UP') {
            sendWelcomeEmail(user.email!, getUserName(user));
            return;
          }

          // OAuth peut émettre SIGNED_IN pour un compte tout juste créé.
          const { data: profile, error } = await supabase
            .from('profils')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Impossible de vérifier le type de connexion Folio Dev :', error);
            return;
          }

          if (!profile) {
            sendWelcomeEmail(user.email!, getUserName(user));
          } else {
            sendLoginEmail(user.email!, getUserName(user), new Date());
          }
        })();
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthEvent);

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
};