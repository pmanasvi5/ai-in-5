export function isIosSafari(userAgent: string, hasMSStream: boolean): boolean {
  const isIos = /iPhone|iPad|iPod/.test(userAgent) && !hasMSStream
  // Other iOS browsers (Chrome/Firefox/Edge/Opera on iOS) all use WebKit and
  // include "Safari" in their UA too, but also carry their own token.
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)
  return isIos && !isOtherIosBrowser
}
