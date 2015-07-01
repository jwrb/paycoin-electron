var BrowserWindow = require('browser-window')
  , path = require('path')
  , nopt = require('nopt')
  , knownOpts = { config: path
                , datadir: path
                , 'no-daemon': Boolean
                }
  , shortHand = { c: ['--config']
                , d: ['--datadir']
                , n: ['--no-daemon']
                }
  , parsed = nopt(knownOpts, shortHand)
  , Menu = require('menu')
  , MenuItem = require('menu-item')

var name = 'Paycoin'
var index = 'file://' + path.join(__dirname, 'views', 'index.html')
var splashUrl = 'file://' +
  path.join(__dirname, 'lib', 'windows', 'loading.html')

if (parsed.config) {
  process.env.XPY_CONFIG = parsed.config
} else if (parsed.datadir){
  process.env.XPY_CONFIG = parsed.datadir+"/paycoin.conf"
}

var daemon = require('./lib/daemon')()

if (!parsed.daemon && (process.platform === 'darwin' || process.platform === 'linux')) {
  if (parsed.config) {
      daemon.start(parsed.config, 0)
  } else if (parsed.datadir) {
    daemon.start(parsed.datadir, 1)
  } else {
    daemon.start(0, 0)
  }
}

var app = require('app')
app.on('ready', setup)
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin' || process.platform !== 'linux') {
    app.quit()
  }
})

daemon.on('stopped', function() {
  app.quit()
})

app.on('before-quit', function() {
  if (daemon.running) {
    daemon.stop()
  }
})

var mainWindow, splash

function setup() {
  // TODO(evanlucas) Add custom protocol handler
  // that will direct to the send page and pre-populate the fields

  // setup the menu
  setupMenu()

  // load the splash screen
  splash = new BrowserWindow({
    width: 400
  , height: 200
  , resizable: false
  , center: true
  , type: 'splash'
  , frame: false
  })
  splash.loadUrl(splashUrl)

  setTimeout(function() {
    splash.close()
  }, 5000)

  splash.on('close', function() {
    mainWindow = new BrowserWindow({
      'width': 960
    , 'height': 650
    , 'min-height': 650
    , 'min-width': 960
    , 'center': true
    , 'title': name
    })

    mainWindow.loadUrl(index)

    mainWindow.on('closed', function() {
      mainWindow = null
    })

    mainWindow.on('page-title-updated', function(e) {
      e.preventDefault()
    })
  })
}

function setupMenu() {
  var template = [
    {
      label: 'Paycoin'
    , submenu: [
        {
          label: 'About'
        }
      , { type: 'separator' }
      , {
          label: 'Toggle DevTools'
        , accelerator: 'Alt+Command+I'
        , click: function() {
            BrowserWindow.getFocusedWindow().toggleDevTools()
          }
        }
      , {
          label: 'Quit'
        , accelerator: 'Command+Q'
        , click: function() { app.quit() }
        }
      ]
    }
  , {
      label: 'Edit'
    , submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' }
      , { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' }
      , { type: 'separator' }
      , { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' }
      , { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' }
      , { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' }
      ]
    }
  ]

  var menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
