import { type ElectronHandlers } from "../electron/preload";

declare global {
  interface Window {
    electron: ElectronHandlers;
  }
}

export {};