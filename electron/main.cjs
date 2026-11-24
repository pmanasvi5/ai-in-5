// Electron entry point for the AI in 5 desktop app.
//
// The app's web build is served from a tiny local HTTP server (rather than
// loaded via file://) so relative fetches to data/*.json and the service
// worker registration behave exactly like they do in a real browser — no
// special-casing needed in the app code itself.
const { app, BrowserWindow, shell } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { checkForUpdates } = require('./updates.cjs')

const WEB_ROOT = path.join(__dirname, '..', 'dist-electron-web')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function startLocalServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      let filePath = path.join(WEB_ROOT, urlPath === '/' ? 'index.html' : urlPath)

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: any unresolved path serves index.html (the app
          // uses hash-based routing, so this mainly covers direct requests
          // for "/" variants, not real client routes).
          fs.readFile(path.join(WEB_ROOT, 'index.html'), (fallbackErr, fallbackData) => {
            if (fallbackErr) {
              res.writeHead(404)
              res.end('Not found')
              return
            }
            res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] })
            res.end(fallbackData)
          })
          return
        }
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(data)
      })
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve(port)
    })
  })
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: '#FAF9F6',
    title: 'AI in 5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.loadURL(`http://127.0.0.1:${port}/`)

  // Open real external links (e.g. "Read original") in the OS browser
  // instead of inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  const port = await startLocalServer()
  createWindow(port)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port)
  })

  // Give the window a moment to appear before possibly popping an update
  // dialog on top of it (or, on Windows, starting a background download).
  setTimeout(checkForUpdates, 3000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
