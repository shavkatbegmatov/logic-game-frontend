/**
 * Array Utility Functions
 * Deep comparison and array manipulation utilities
 */

/**
 * Deep equality check for arrays of objects
 * Compares two arrays element by element
 */
export function deepEqualArrays<T extends Record<string, any>>(
  arr1: T[] | null | undefined,
  arr2: T[] | null | undefined
): boolean {
  if (arr1 === arr2) return true
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i]
    const obj2 = arr2[i]

    if (obj1 === obj2) continue // Same reference, no need to compare deeply

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return false // Not objects or null, and not strictly equal
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
        return false
      }
    }
  }
  return true
}
