// Sur le web, les modules natifs sans equivalent navigateur sont remplaces
// par leur version web (dossier web/). Android et iOS ne sont pas touches.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const VERSIONS_WEB = {
  'expo-camera': path.resolve(__dirname, 'web/expo-camera.tsx'),
  'expo-media-library': path.resolve(__dirname, 'web/expo-media-library.ts'),
  'expo-file-system': path.resolve(__dirname, 'web/expo-file-system.ts'),
}
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && VERSIONS_WEB[moduleName]) return { type: 'sourceFile', filePath: VERSIONS_WEB[moduleName] }
  return context.resolveRequest(context, moduleName, platform)
}
module.exports = config
