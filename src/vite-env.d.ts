/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Platform base URL encoded into an issue screen's wallet QR (QR v1 contract,
   * spec FS-1.2.1 D8). Defaults to `window.location.origin` when unset — override
   * with your machine's LAN IP so a physical wallet device can reach it (a
   * localhost origin is unreachable from a phone on the same network).
   */
  readonly VITE_QR_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
