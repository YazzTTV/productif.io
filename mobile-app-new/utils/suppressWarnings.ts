// Supprimer les warnings NativeEventEmitter
// Ce fichier est utilisé pour supprimer les avertissements liés à NativeEventEmitter
// qui peuvent apparaître dans React Native

import { LogBox } from 'react-native';

// Supprimer les warnings spécifiques si nécessaire
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'NativeEventEmitter',
]);



