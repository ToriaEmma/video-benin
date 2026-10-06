// Sur le web, les modules natifs sans equivalent navigateur sont remplaces
// par leur version web (dossier web/). Android et iOS ne sont pas touches.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const VERSIONS_WEB = {
  'expo-camera': path.resolve(__dirname, 'web/expo-camera.tsx'),
  'expo-media-library': path.resolve(__dirname, 'web/expo-media-library.ts'),
  'expo-file-system': path.resolve(__dirname, 'web/expo-file-system.ts'),
  'expo-video': path.resolve(__dirname, 'web/expo-video.tsx'),
}
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const version = platform === 'web' && VERSIONS_WEB[moduleName]
  // La version web peut importer le vrai module : on ne la redirige pas sur elle-meme.
  if (version && context.originModulePath !== version) return { type: 'sourceFile', filePath: version }
  return context.resolveRequest(context, moduleName, platform)
}
module.exports = config
