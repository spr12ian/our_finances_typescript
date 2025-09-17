// Generic guard factories — DRY, reuse everywhere

/** Guard for "does this object have a method named <name>?" */
export function makeMethodGuard<
  Name extends string,
  Fn extends (...args: any[]) => any = (...args: any[]) => any
>(name: Name) {
  return function <T extends object>(x: T): x is T & { [K in Name]: Fn } {
    return !!x && typeof (x as any)[name] === "function";
  };
}

/** Guard for "does this object have a property named <name> of typeof <kind>?" */
export function makePropGuard<Name extends string, Kind extends
  | "string" | "number" | "boolean" | "bigint" | "symbol" | "undefined"
  | "object" | "function">(name: Name, kind: Kind) {
  return function <T extends object>(x: T): x is T & { [K in Name]: unknown } {
    const v = (x as any)?.[name];
    return kind === "object" ? v !== null && typeof v === "object"
                             : typeof v === kind;
  };
}

/** Guard for "does this object have ALL of these methods?" */
export function makeAllMethodsGuard<const Names extends readonly string[]>(
  ...names: Names
) {
  return function <T extends object>(
    x: T
  ): x is T & { [K in Names[number]]: (...args: any[]) => any } {
    return !!x && names.every(n => typeof (x as any)[n] === "function");
  };
}
