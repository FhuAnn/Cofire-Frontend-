// constants.js - Hằng số và cấu hình

// Icon mapping cho các loại file
export const iconMap = {
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

// Cấu hình markdown
export const MARKED_OPTIONS = {
  langPrefix: "hljs language-",
};

// Trạng thái ứng dụng
export const initialState = {
  currentFile: {
    code: "",
    fileName: "", 
    selectedCode: "",
    selectionStart: 0,
    selectionEnd: 0,
    selectionStartCharacter: 0,
    selectionEndCharacter: 0,
    relativePath: "",
  },
  isLoading: false,
  attachedFiles: [],
  isInVisible: false,
  dragCounter: 0,
};