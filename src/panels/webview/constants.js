// ====== Constants and Configuration ======

export const ICON_MAP = {
  angular: "angular.svg",
  cpp: "cpp.svg",
  cs: "cs.svg",
  css: "css.svg",
  docker: "docker.svg",
  folder: "folder.svg",
  go: "go.svg",
  html: "html.svg",
  java: "java.svg",
  js: "js.svg",
  npm: "npm.svg",
  php: "php.svg",
  python: "python.svg",
  rb: "ruby.svg",
  ts: "ts.svg",
  tsx: "tsx.svg",
  vue: "vue.svg",
  default: "default.svg",
  json: "json.svg",
};

export const MARKED_OPTIONS = {
  langPrefix: "hljs language-",
};

export const MODELS = [
  { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'Gemini 2.0 Flash', label: 'Gemini 2.0 Flash' },
  { value: 'GPT-4.1', label: 'GPT-4.1' },
  { value: 'GPT-4o', label: 'GPT-4o' },
  { value: 'GPT-o3-mini', label: 'o3-mini' },
];

export const DEFAULT_MODEL = 'GPT-4.1';

export const MESSAGE_TYPES = {
  UPDATE: 'update',
  REPLY: 'reply',
  FILE_ATTACHED: 'fileAttached',
  SELECTION_ATTACHED: 'selectionAttached',
  FOLDER_ATTACHED: 'folderAttached',
  ATTACH_FILE: 'attachFile',
  SEND_PROMPT: 'sendPromptToModel',
  GOTO_SELECTION: 'gotoSelection',
  FILES_DROPPED: 'filesDropped'
};