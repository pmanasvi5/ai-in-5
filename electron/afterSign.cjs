// electron-builder afterSign hook.
//
// Without a paid Apple Developer certificate, electron-builder skips code
// signing entirely, leaving the app bundle with NO signature at all —
// not even an ad-hoc one. On Apple Silicon, Gatekeeper requires every
// executable to carry at least a valid ad-hoc signature to run, and an
// unsigned app inside a quarantined (browser-downloaded) disk image can
// make Finder report the misleading "disk image is corrupted" error
// instead of the expected "unidentified developer" prompt.
//
// Signing with identity "-" is free and doesn't require any Apple
// Developer account — it just satisfies the "has *a* signature" check.
// Users still see (and must click through) the standard "unidentified
// developer" warning, which is expected and is covered in the app's own
// install instructions.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  console.log(`[afterSign] Ad-hoc signing ${appPath}`)
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
}
