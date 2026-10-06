// Version web de expo-video : le vrai module, avec des reglages par defaut
// adaptes au navigateur pour que la video se comporte comme dans l'application.
// - pas de commandes du navigateur (elles donnaient l'air d'un lecteur externe) ;
// - lecture dans la page sur iPhone (playsInline), sinon Safari passe en plein ecran ;
// - largeur et hauteur a 100 % : une balise video ignore left/right/top/bottom et
//   s'affichait a sa taille d'origine, d'ou l'effet de zoom.
import React, { forwardRef } from 'react'
import * as Original from 'expo-video'

export * from 'expo-video'

type Props = React.ComponentProps<typeof Original.VideoView>

export const VideoView = forwardRef<Original.VideoView, Props>(function VideoView(props, ref) {
  return (
    <Original.VideoView
      ref={ref}
      {...props}
      nativeControls={props.nativeControls ?? false}
      playsInline={props.playsInline ?? true}
      allowsPictureInPicture={props.allowsPictureInPicture ?? false}
      style={[{ width: '100%', height: '100%' }, props.style]}
    />
  )
})
