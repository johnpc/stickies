/** Map a filename to a highlight.js language for DOC previews, or null for plain
 * text (.txt/.log/.csv). Pure + unit-tested. Keeps the ext→lang table in one
 * place so CodeSticky can highlight uploaded code files the same as pasted ones. */
const EXT_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  html: 'xml',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  markdown: 'markdown',
  toml: 'ini',
  ini: 'ini',
  env: 'ini',
};

export function docLanguage(fileName: string): string | null {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  return EXT_LANG[ext] ?? null;
}
