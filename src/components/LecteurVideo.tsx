'use client'

import { useEffect, useRef } from 'react'
import { ajouterVisionnage } from '../services/evenements'

/**
 * Lecteur vidéo de la chaîne : YouTube (API IFrame officielle, qui permet de
 * mesurer le temps de visionnage réel) ou Facebook (lecteur intégré).
 */

interface YTPlayer { destroy(): void }
interface YTNamespace {
  Player: new (el: HTMLElement, opts: {
    videoId: string
    playerVars?: Record<string, number | string>
    events?: { onStateChange?: (e: { data: number }) => void }
  }) => YTPlayer
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number }
}

declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

let chargement: Promise<YTNamespace> | null = null

function chargerApiYoutube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!chargement) {
    chargement = new Promise(resolve => {
      const precedent = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { precedent?.(); resolve(window.YT!) }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      document.head.appendChild(s)
    })
  }
  return chargement
}

export function LecteurVideo({ evenementId, platform, videoId, url, titre, autoplay = true }: {
  evenementId?: string
  platform: 'youtube' | 'facebook'
  videoId?: string
  url: string
  titre: string
  autoplay?: boolean
}) {
  const cible = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (platform !== 'youtube' || !videoId || !cible.current) return
    let player: YTPlayer | null = null
    let debut: number | null = null
    let cumul = 0
    let annule = false

    const arreter = () => {
      if (debut !== null) { cumul += (Date.now() - debut) / 1000; debut = null }
    }
    const envoyer = () => {
      arreter()
      if (evenementId && cumul >= 1) ajouterVisionnage(evenementId, cumul)
      cumul = 0
    }

    chargerApiYoutube().then(YT => {
      if (annule || !cible.current) return
      player = new YT.Player(cible.current, {
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: e => {
            if (e.data === YT.PlayerState.PLAYING) { if (debut === null) debut = Date.now() }
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) arreter()
            else if (e.data === YT.PlayerState.ENDED) envoyer()
          },
        },
      })
    })

    // Envoi aussi quand l'onglet est fermé ou masqué.
    const onHide = () => { if (document.visibilityState === 'hidden') envoyer() }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      annule = true
      document.removeEventListener('visibilitychange', onHide)
      envoyer()
      player?.destroy()
    }
  }, [platform, videoId, evenementId, autoplay])

  if (platform === 'facebook') {
    return (
      <iframe
        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=${autoplay ? 'true' : 'false'}`}
        title={titre}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }
  return <div style={{ width: '100%', height: '100%' }}><div ref={cible} style={{ width: '100%', height: '100%' }} /></div>
}
