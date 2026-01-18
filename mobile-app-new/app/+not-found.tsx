import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  const { t } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: t('notFoundTitle', undefined, 'Oops!') }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('notFoundMessage', undefined, 'This screen does not exist.')}</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">{t('goHome', undefined, 'Go to home screen!')}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
