'use client'

import { Captcha } from '../../components/securite/Captcha'

declare global {
  interface Window { ReactNativeWebView?: { postMessage(message: string): void } }
}

export function CaptchaMobile() {
  return (
    <div style={{ padding: 6, display: 'flex', justifyContent: 'center', background: 'transparent' }}>
      <Captcha onJeton={jeton => window.ReactNativeWebView?.postMessage(jeton ?? 'expire')} />
    </div>
  )
}
