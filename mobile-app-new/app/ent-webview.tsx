import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useLanguage } from '@/contexts/LanguageContext';

const WEB_APP_BASE_URL =
  Constants.expoConfig?.extra?.webAppUrl ||
  process.env.EXPO_PUBLIC_WEB_APP_URL ||
  'https://www.productif.io';

const CONNECT_ENT_URL = `${WEB_APP_BASE_URL.replace(/\/$/, '')}/connect/ent`;
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

export default function EntWebViewScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [targetUrl, setTargetUrl] = useState(CONNECT_ENT_URL);

  const inputPlaceholder = useMemo(
    () => t('scanSchedulePlaceholder', undefined, 'Ex: ent moma'),
    [t]
  );

  const resolveUrlFromQuery = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return CONNECT_ENT_URL;
    const looksLikeUrl = trimmed.includes('.') && !trimmed.includes(' ');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (looksLikeUrl) {
      return `https://${trimmed}`;
    }
    return `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`;
  };

  const handleSearch = () => {
    const url = resolveUrlFromQuery(query);
    setTargetUrl(url);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('scanScheduleTitle', undefined, 'Scanner emploi du temps')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color="rgba(0, 0, 0, 0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={inputPlaceholder}
            placeholderTextColor="rgba(0, 0, 0, 0.35)"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.7}
        >
          <Text style={styles.searchButtonText}>
            {t('search', undefined, 'Rechercher')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C27A" />
        </View>
      )}

      <WebView
        source={{ uri: targetUrl }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 0,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#00C27A',
  },
  searchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 104,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
