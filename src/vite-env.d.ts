/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QA_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
