/**
 * Utility Type Definitions
 * Common utility types used throughout the application
 */

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Nullable type
export type Nullable<T> = T | null

// Optional type
export type Optional<T> = T | undefined

// Maybe type
export type Maybe<T> = T | null | undefined

// Non-nullable type
export type NonNullable<T> = T extends null | undefined ? never : T

// Array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never

// Promise type extraction
export type Awaited<T> = T extends Promise<infer U> ? U : T

// Function type
export type Fn<Args extends any[] = any[], Return = void> = (...args: Args) => Return

// Async function type
export type AsyncFn<Args extends any[] = any[], Return = void> = (
  ...args: Args
) => Promise<Return>

// Object with string keys
export type StringKeyed<T = any> = Record<string, T>

// Object with number keys
export type NumberKeyed<T = any> = Record<number, T>

// Mutable type (removes readonly)
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

// Required deep
export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object ? RequiredDeep<T[P]> : T[P]
}

// Readonly deep
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P]
}

// Pick by value type
export type PickByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>

// Omit by value type
export type OmitByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? never : K }[keyof T]>

// Extract from union
export type Extract<T, U> = T extends U ? T : never

// Exclude from union
export type Exclude<T, U> = T extends U ? never : T

// Value of object
export type ValueOf<T> = T[keyof T]

// Entries type
export type Entries<T> = [keyof T, ValueOf<T>][]

// Constructor type
export type Constructor<T = any> = new (...args: any[]) => T

// Abstract constructor type
export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T

// Class type
export type Class<T = any> = Constructor<T> | AbstractConstructor<T>

// Branded type (for nominal typing)
export type Brand<K, T> = K & { __brand: T }

// ID types
export type ID = string | number
export type StringID = Brand<string, 'StringID'>
export type NumberID = Brand<number, 'NumberID'>

// Tuple to union
export type TupleToUnion<T extends readonly any[]> = T[number]

// Union to intersection
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

// Prettify type (for better IDE display)
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
