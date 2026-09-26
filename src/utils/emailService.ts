import axios from 'axios';
import { supabase } from '../supabaseClient';

type LocationData = {
  ip: string;
  city: string;
  country_name: string;
  continent_name: string;
};

type IpApiResponse = Partial<LocationData> & {
  continent_code?: string;
  error?: boolean;
  reason?: string;
};

const continentNames: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

const getLocationData = async (): Promise<LocationData | null> => {
  try {
    const { data } = await axios.get<IpApiResponse>('https://ipapi.co/json/', { timeout: 4000 });
    if (data.error) throw new Error(data.reason || 'ipapi.co a renvoyé une erreur.');
    if (!data.ip) throw new Error('ipapi.co n’a pas retourné d’adresse IP.');

    return {
      ip: data.ip,
      city: data.city || 'Non disponible',
      country_name: data.country_name || 'Non disponible',
      continent_name: data.continent_name || continentNames[data.continent_code || ''] || 'Non disponible',
    };
  } catch (error) {
    console.error('Impossible de récupérer la géolocalisation :', error);
    return null;
  }
};

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

const sendEmailWithLocation = async (payload: Record<string, unknown>): Promise<void> => {
  const location = await getLocationData();
  await invokeEmailFunction({ ...payload, location });
};

export const sendWelcomeEmail = (userEmail: string, userName = ''): void => {
  if (!userEmail) return;

  void sendEmailWithLocation({
    type: 'welcome',
    email: userEmail,
    name: userName,
  });
};

export const sendLoginEmail = (userEmail: string, userName = '', loginTime: Date): void => {
  if (!userEmail) return;

  void sendEmailWithLocation({
    type: 'login',
    email: userEmail,
    name: userName,
    loginTime: loginTime.toISOString(),
  });
};
