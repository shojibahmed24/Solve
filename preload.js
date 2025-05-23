const { contextBridge, ipcRenderer } = require('electron');
const Tesseract = require('tesseract.js');
require('dotenv').config(); // load .env if used

contextBridge.exposeInMainWorld('electronAPI', {
  tesseract: Tesseract,
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  getEnv: () => ({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  })
});
