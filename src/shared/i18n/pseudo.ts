export const PSEUDO_LANGUAGE = 'pseudo';

const ACCENTS: Record<string, string> = { a: 'á', e: 'ë', i: 'î', o: 'ö', u: 'ü', A: 'Å', E: 'Ë', I: 'Î', O: 'Ö', U: 'Ü', c: 'ç', n: 'ñ' };
const PROTECTED = /({{[^}]+}}|<\/?\w+\s*\/?>|\\n)/;
const GROWTH = 0.4;
const PADDING = '·';

const accent = (text: string) => text.replace(/[aeiouAEIOUcn]/g, (letter) => ACCENTS[letter] ?? letter);

export function pseudoText(text: string): string {
  const parts = text.split(PROTECTED).map((part, index) => (index % 2 === 1 ? part : accent(part)));
  const padding = PADDING.repeat(Math.ceil(text.length * GROWTH));
  return `[${parts.join('')} ${padding}]`;
}

type Tree = { [key: string]: string | Tree };

export function pseudoTree(tree: Tree): Tree {
  return Object.fromEntries(Object.entries(tree).map(([key, value]) => [key, typeof value === 'string' ? pseudoText(value) : pseudoTree(value)]));
}
