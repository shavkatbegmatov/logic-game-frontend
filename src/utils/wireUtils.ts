/**
 * Wire utility functions
 * Common functions for wire calculations
 */

import type { Gate, Wire } from '@/types'

/**
 * Create smooth Bezier curve points
 */
export const createBezierPoints = (x1: number, y1: number, x2: number, y2: number, steps = 20): number[] => {
  const points: number[] = []
  const distance = Math.abs(x2 - x1)
  const controlOffset = Math.min(distance * 0.5, 100)

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const cx1 = x1 + controlOffset
    const cy1 = y1
    const cx2 = x2 - controlOffset
    const cy2 = y2

    // Cubic Bezier formula
    const x = Math.pow(1 - t, 3) * x1 +
              3 * Math.pow(1 - t, 2) * t * cx1 +
              3 * (1 - t) * Math.pow(t, 2) * cx2 +
              Math.pow(t, 3) * x2

    const y = Math.pow(1 - t, 3) * y1 +
              3 * Math.pow(1 - t, 2) * t * cy1 +
              3 * (1 - t) * Math.pow(t, 2) * cy2 +
              Math.pow(t, 3) * y2

    points.push(x, y)
  }

  return points
}

/**
 * Get wire gates with optional drag handling
 */
export const getWireGates = (
  wire: Wire,
  gates: Gate[],
  draggedItems?: Record<string | number, { x: number; y: number }> | { id: string | number; x: number; y: number } | null
): { fromGate: Gate | null; toGate: Gate | null } => {
  let fromGate = gates.find(g => g.id === wire.fromGate) || null
  let toGate = gates.find(g => g.id === wire.toGate) || null

  if (!fromGate || !toGate) return { fromGate: null, toGate: null }

  // Handle dragging - support both draggedItems object and single draggingGate
  if (draggedItems) {
    if ('id' in draggedItems) {
      // Single draggingGate case - use type assertion for proper narrowing
      const draggingGate = draggedItems as { id: string | number; x: number; y: number }
      if (draggingGate.id === fromGate.id) {
        fromGate = { ...fromGate, x: draggingGate.x, y: draggingGate.y }
      }
      if (draggingGate.id === toGate.id) {
        toGate = { ...toGate, x: draggingGate.x, y: draggingGate.y }
      }
    } else {
      // draggedItems object case
      const draggedItemsRecord = draggedItems as Record<string | number, { x: number; y: number }>
      const fromDragged = draggedItemsRecord[fromGate.id]
      if (fromDragged) {
        fromGate = { ...fromGate, x: fromDragged.x, y: fromDragged.y }
      }

      const toDragged = draggedItemsRecord[toGate.id]
      if (toDragged) {
        toGate = { ...toGate, x: toDragged.x, y: toDragged.y }
      }
    }
  }

  return { fromGate, toGate }
}
