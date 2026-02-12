export type JsonPrimitive = boolean | number | string | null

export type JsonValue = JsonArray | JsonObject | JsonPrimitive

export type JsonArray = JsonValue[]

export type JsonObject = {
  [key: string]: JsonValue | undefined
}
