// Helpers to treat "05 NEW" style module names as the plain module ("5"/"05").

const NEW_SUFFIX = /[\s-]+new\s*$/i;

export function isLegacyNewName(name: string | null | undefined): boolean {
  return NEW_SUFFIX.test((name || '').trim());
}

export function stripNewSuffix(name: string | null | undefined): string {
  return (name || '').trim().replace(NEW_SUFFIX, '').trim();
}

// Comparison key: "05 NEW" / "05" / "5" -> "5", "Mending" -> "mending"
export function moduleKey(name: string | null | undefined): string {
  const s = stripNewSuffix(name);
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

// Drops "XX NEW" modules when the plain "XX" module exists (members/history live there),
// otherwise shows the "NEW" module under its plain name.
export function resolveModules<T extends { name: string }>(mods: T[]): T[] {
  const plainKeys = new Set(mods.filter(m => !isLegacyNewName(m.name)).map(m => moduleKey(m.name)));
  return mods
    .filter(m => !(isLegacyNewName(m.name) && plainKeys.has(moduleKey(m.name))))
    .map(m => (isLegacyNewName(m.name) ? { ...m, name: stripNewSuffix(m.name) } : m));
}
