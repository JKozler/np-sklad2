// src/utils/searchHelpers.ts

/**
 * Automaticky přidá wildcard znaky (*) na začátek a konec vyhledávacího dotazu
 * pro podporu vyhledávání s částečnými shodami.
 *
 * @param query - Vyhledávací dotaz od uživatele
 * @returns Vyhledávací dotaz s wildcards, nebo prázdný string pokud je query prázdný
 *
 * @example
 * wrapWithWildcards('jaho') // returns '*jaho*'
 * wrapWithWildcards('*jaho') // returns '*jaho*' (nezmění se, už má wildcard)
 * wrapWithWildcards('') // returns ''
 * wrapWithWildcards('  ') // returns ''
 */
export function wrapWithWildcards(query: string): string {
  // Ořízni whitespace
  const trimmed = query.trim();

  // Pokud je prázdný, vrať prázdný string
  if (!trimmed) {
    return '';
  }

  // Pokud už má wildcards na obou stranách, vrať jak je
  if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
    return trimmed;
  }

  // Přidej wildcard na začátek pokud tam není
  const withStartWildcard = trimmed.startsWith('*') ? trimmed : `*${trimmed}`;

  // Přidej wildcard na konec pokud tam není
  const withBothWildcards = withStartWildcard.endsWith('*') ? withStartWildcard : `${withStartWildcard}*`;

  return withBothWildcards;
}
