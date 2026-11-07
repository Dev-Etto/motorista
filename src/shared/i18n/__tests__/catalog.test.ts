import { resources, SOURCE_LANGUAGE } from '@shared/i18n/resources';

type Tree = { [key: string]: string | Tree };

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PARAMETER = /{{\s*([\w.]+)\s*}}/g;
const COMMON_COUNTS = Array.from({ length: 201 }, (_, count) => count);

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') return { ...all, [path]: value };
    return { ...all, ...flatten(value, path) };
  }, {});
}

const catalogOf = (language: string) => {
  const namespaces = (resources as unknown as Record<string, Record<string, Tree>>)[language] ?? {};
  return Object.entries(namespaces).reduce<Record<string, string>>((all, [namespace, tree]) => ({ ...all, ...flatten(tree, namespace) }), {});
};

const baseKey = (key: string) => key.replace(PLURAL_SUFFIX, '');
const parametersOf = (text: string) => [...text.matchAll(PARAMETER)].map((match) => match[1]).sort();
const source = catalogOf(SOURCE_LANGUAGE);
const languages = Object.keys(resources);

describe('catálogo de traduções', () => {
  it('nenhum texto vazio', () => {
    languages.forEach((language) => {
      const empty = Object.entries(catalogOf(language)).filter(([, text]) => text.trim() === '');
      expect(empty).toEqual([]);
    });
  });

  it.each(languages)('%s tem as mesmas chaves e parâmetros do português', (language) => {
    const catalog = catalogOf(language);
    const sourceBases = new Set(Object.keys(source).map(baseKey));
    const bases = new Set(Object.keys(catalog).map(baseKey));
    expect([...bases].sort()).toEqual([...sourceBases].sort());

    Object.entries(catalog).forEach(([key, text]) => {
      const original = source[key] ?? source[`${baseKey(key)}_other`] ?? '';
      expect({ key, parameters: parametersOf(text) }).toEqual({ key, parameters: parametersOf(original) });
    });
  });

  it.each(languages)('%s tem todas as formas de plural do idioma', (language) => {
    const rules = new Intl.PluralRules(language);
    const categories = [...new Set(COMMON_COUNTS.map((count) => rules.select(count)))];
    const catalog = catalogOf(language);
    const plurals = new Set(
      Object.keys(catalog)
        .filter((key) => PLURAL_SUFFIX.test(key))
        .map(baseKey),
    );
    plurals.forEach((base) => {
      categories.forEach((category) => expect(`${base}_${category} ${catalog[`${base}_${category}`] ? 'ok' : 'faltando'}`).toBe(`${base}_${category} ok`));
    });
  });
});
