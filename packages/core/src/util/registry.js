/**
 * A registry is just an ordered list of modules with a lookup by key.
 * Every pluggable thing in Otrelink (block types, themes, wallpapers,
 * button styles, fonts, socials, animations) is a registry.
 *
 * To add a module: append it to the list passed to createRegistry().
 * To remove one: delete it from that list. Nothing else needs to change.
 */
export function createRegistry(name, modules, key = 'id') {
  const map = new Map();
  for (const mod of modules) {
    const k = mod[key];
    if (!k) throw new Error(`[${name}] module without "${key}"`);
    if (map.has(k)) throw new Error(`[${name}] duplicate ${key} "${k}"`);
    map.set(k, mod);
  }
  return {
    name,
    list: () => [...map.values()],
    keys: () => [...map.keys()],
    get: (k) => map.get(k),
    has: (k) => map.has(k),
    /** Get by key or fall back to the first module (safe default). */
    resolve: (k) => map.get(k) ?? modules[0],
    options: () => [...map.values()].map((m) => ({ value: m[key], label: m.label ?? m.name ?? m[key] })),
  };
}
