/**
 * productifio://rejoindre/CODE : ouvert depuis la page web d'invitation
 * (app/rejoindre/[code]/page.tsx cote Next.js).
 *
 * Le code n'est PAS traite ici : il est depose, puis l'onglet Communaute le
 * consomme a son affichage (lib/communityPendingCode.ts). Ainsi un utilisateur
 * deconnecte ne perd pas l'invitation, elle s'applique apres sa connexion.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuthToken } from '@/lib/api';
import { setPendingCommunityCode } from '@/lib/communityPendingCode';

export default function JoinByLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (typeof code === 'string' && code.trim()) {
        await setPendingCommunityCode(code);
      }
      const token = await getAuthToken();
      router.replace(token ? '/(tabs)/leaderboard' : '/');
    })();
  }, [code, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator color="#16A34A" />
    </View>
  );
}
