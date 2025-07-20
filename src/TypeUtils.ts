// TypeUtils.ts
export function getType(value: unknown): string {
  if (value === null) return "null";
  const baseType = typeof value;
  if (!["object", "function"].includes(baseType)) return baseType;

  const tag = (value as any)[Symbol.toStringTag];
  if (typeof tag === "string") return tag;

  if (
    baseType === "function" &&
    Function.prototype.toString.call(value).startsWith("class")
  ) {
    return "class";
  }

  const className = (value as any).constructor?.name;
  if (typeof className === "string" && className !== "") return className;

  return baseType;
}
