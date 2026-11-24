// Checks for and applies app updates, published to GitHub Releases by
// .github/workflows/build-desktop-apps.yml.
//
// IMPORTANT PLATFORM LIMIT: silent, automatic installation (electron-updater
// + Squirrel) only works on Windows without paying for anything, because it
// doesn't require a code-signing certificate to apply an update. macOS's
// update mechanism (Squirrel.Mac) refuses to apply an update unless the app
// is signed with a paid Apple Developer ID certificate -- our app is only
// ad-hoc signed (free), which satisfies Gatekeeper enough to *run* but not
// enough for Squirrel.Mac to trust an *update*. So on Mac, this does the
// next best free thing: checks GitHub for a newer version and offers a
// one-click link to the download page, same as asking a user to manually
// redownload, just without them having to go looking for it.
const { app, dialog, shell } = require('electron')
const https = require('node:https')

const REPO = 'pmanasvi5/ai-in-5'
const USER_AGENT = 'AIin5-DesktopApp'

function parseVersion(tag) {
  return tag.replace(/^v/, '').split('.').map(Number)
}

function isNewer(latest, current) {
  for (let i = 0; i < Math.max(latest.length, current.length); i++) {
    const l = latest[i] || 0
    const c = current[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { 'User-Agent': USER_AGENT, Accept: 'application/vnd.github+json' } },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API returned ${res.statusCode}`))
            return
          }
          try {
            resolve(JSON.parse(body))
          } catch (err) {
            reject(err)
          }
        })
      },
    )
    req.on('error', reject)
    req.setTimeout(10_000, () => req.destroy(new Error('timed out')))
  })
}

async function checkForUpdatesOnMac() {
  try {
    const release = await fetchLatestRelease()
    const latest = parseVersion(release.tag_name)
    const current = parseVersion(app.getVersion())
    if (!isNewer(latest, current)) return

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Update available',
      message: `AI in 5 ${release.tag_name} is available (you have v${app.getVersion()}).`,
      detail:
        "This app isn't notarized, so it can't update itself silently the way a paid App Store app can " +
        '— but you can grab the new version in one click.',
      buttons: ['Download update', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    if (response === 0) {
      shell.openExternal(`https://github.com/${REPO}/releases/latest`)
    }
  } catch (err) {
    console.error('[updates] check failed:', err.message)
  }
}

function checkForUpdatesOnWindows() {
  try {
    // Lazy-required: electron-updater touches platform-specific internals
    // at import time that only make sense on Windows/Squirrel targets.
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('error', (err) => console.error('[updates] autoUpdater error:', err.message))
    autoUpdater.checkForUpdatesAndNotify()
  } catch (err) {
    console.error('[updates] Windows auto-update unavailable:', err.message)
  }
}

function checkForUpdates() {
  if (process.platform === 'win32') {
    checkForUpdatesOnWindows()
  } else if (process.platform === 'darwin') {
    checkForUpdatesOnMac()
  }
}

module.exports = { checkForUpdates }
