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
  py: "python.svg",
  rb: "ruby.svg",
  ts: "ts.svg",
  tsx: "tsx.svg",
  jsx: "jsx.svg",
  sql: "sql.svg",
  vue: "vue.svg",
  default: "default.svg",
  json: "json.svg",
};

export const MARKED_OPTIONS = {
  langPrefix: "hljs language-",
};

export const MODELS = [
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-o3-mini", label: "o3-mini" },
];

export const DEFAULT_MODEL = "gemini-2.0-flash";

export const MESSAGE_TYPES = {
  UPDATE: "update",
  REPLY: "reply",
  FILE_ATTACHED: "fileAttached",
  SELECTION_ATTACHED: "selectionAttached",
  FOLDER_ATTACHED: "folderAttached",
  ATTACH_FILE: "attachFile",
  SEND_PROMPT: "sendPromptToModel",
  GOTO_SELECTION: "gotoSelection",
  FILES_DROPPED: "filesDropped",
  NEW_MODEL_SELECTED: "newModelSelected",
  ERROR: "error",
  SHOW_HISTORY: "showHistory",
  SHOW_CONVERSATION: "showConversationDetail",
  NEW_CHAT: "newChat",
  DELETE_CONVERSATION: "deleteConversation",
  GITHUB_LOGIN: "github-login",
  LOGIN_SUCCESS: "loginSuccess",
  NOT_LOGGED_IN_YET: "notLoggedInYest",
  CANCEL_LOGIC_PROCESS: "cancelLoginProcess",
  SHOW_LOGIN_PROCESS: "showProcessLogin",
  CHECK_LOGIN_STATUS: "fetchLoginStatus",
};
