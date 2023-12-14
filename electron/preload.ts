const { contextBridge, ipcRenderer } = require('electron')

const handlers = {
  send: ipcRenderer.send,
  on(event: string, fn: (...args: any[]) => void) { return ipcRenderer.on(event, fn) },
  once(event: string, fn: (...args: any[]) => void) { return ipcRenderer.once(event, fn) },
  removeListener(channel: string, fn: (...args: any[]) => void) { return ipcRenderer.removeListener(channel, fn) },
  removeAllListeners(channel: string) { return ipcRenderer.removeAllListeners(channel) }
}

contextBridge.exposeInMainWorld(
  'electron',
  handlers
)

export type ElectronHandlers = typeof handlers