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
    const welcomedUsers = new Set<string>();

    const handleAuthEvent = (event: string, session: { access_token?: string; user?: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string; last_sign_in_at?: string | null } | null } | null) => {
      const user = session?.user;
      if (!active || !user?.email || (event !== 'SIGNED_UP' && event !== 'SIGNED_IN')) return;

      const eventKey = event === 'SIGNED_IN'
        ? `${event}:${user.id}:${session?.access_token || Date.now()}`
        : `${event}:${user.id}`;
      if (handledEvents.has(eventKey)) return;
      handledEvents.add(eventKey);

      window.setTimeout(() => {
        void (async () => {
          const createdAt = Date.parse(user.created_at || '');
          const lastSignInAt = Date.parse(user.last_sign_in_at || '');
          const isNewAccount = Number.isFinite(createdAt)
            && Number.isFinite(lastSignInAt)
            && Math.abs(lastSignInAt - createdAt) < 60_000;

          if (event === 'SIGNED_UP' || isNewAccount) {
            if (!welcomedUsers.has(user.id)) {
              welcomedUsers.add(user.id);
              sendWelcomeEmail(user.email!, getUserName(user));
            }
            return;
          }

          sendLoginEmail(user.email!, getUserName(user), new Date());
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