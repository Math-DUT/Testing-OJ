import type { Language } from "./types";
export const isCpp = (language: Language) =>
  ["cpp", "cpp20", "cpp23"].includes(language);
export const codeLanguage = (language: Language) =>
  isCpp(language) ? "cpp" : "python";
export const cppStandard = (language: Language) =>
  language === "cpp23" ? "23" : language === "cpp20" ? "20" : "17";
export const languageLabel = (language: Language) =>
  isCpp(language)
    ? `C++${cppStandard(language)} · O2`
    : language === "pypy3"
      ? "PyPy3 · 本机"
      : "Python · 浏览器";
export const languages = ["cpp", "cpp20", "cpp23", "python", "pypy3"] as const;
