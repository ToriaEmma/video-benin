import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Sur le web, preparation propre au navigateur ; sur ordinateur l'application
// est servie dans un cadre de telephone, d'ou l'absence d'enregistrement ici.
const dansCadre = Platform.OS === 'web' ? require('./web/demarrage').preparerWeb() : false

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
if (!dansCadre) registerRootComponent(App);
