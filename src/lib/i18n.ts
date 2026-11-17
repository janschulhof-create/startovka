// @ts-nocheck
import EN from './en.json'
let L = 'cs'
try { L = localStorage.getItem('startovka.lang') || (/^(cs|sk)/i.test(navigator.language || 'cs') ? 'cs' : 'en') } catch { /* ignore */ }
if (typeof document !== 'undefined') document.documentElement.lang = L
export const getLang = () => L
export function setLangGlobal(l) { L = l; try { localStorage.setItem('startovka.lang', l) } catch { /* ignore */ } document.documentElement.lang = l }
/** Přeloží český text do angličtiny (když je zvolena EN); neznámé texty nechá česky. */
export function tr(s) { if (L !== 'en' || typeof s !== 'string') return s; return EN[s] ?? s }
