import React from 'react'
import {
  Text as TexteNatif, TextInput as SaisieNative,
  type TextProps, type TextInputProps,
} from 'react-native'

// Reglage « taille du texte » du systeme : React Native multiplie toutes les
// tailles de police par ce facteur, ce qui fait paraitre l'ecran zoome et
// pousse les elements de largeur fixe hors du cadre. La maquette etant calee
// sur des tailles absolues, on neutralise cette mise a l'echelle ici, une
// seule fois, plutot que de repeter `allowFontScaling` sur chaque element.
//
// Ces deux composants remplacent ceux de react-native dans toute
// l'application : importer `Text` depuis 'react-native' reintroduirait le
// probleme.

export function Text({ allowFontScaling = false, ...props }: TextProps) {
  return <TexteNatif allowFontScaling={allowFontScaling} {...props} />
}

export const TextInput = React.forwardRef<SaisieNative, TextInputProps>(
  function TextInput({ allowFontScaling = false, ...props }, ref) {
    return <SaisieNative ref={ref} allowFontScaling={allowFontScaling} {...props} />
  },
)
