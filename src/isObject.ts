export function isObject(value: unknown): value is Object {
  const type = typeof value;
  return value != null && type === "object";
}
