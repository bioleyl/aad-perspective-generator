export function typedEntries<T extends object>(obj: T): Array<{ [K in keyof T]: [K, T[K]] }[keyof T]> {
  return Object.entries(obj) as Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>;
}
