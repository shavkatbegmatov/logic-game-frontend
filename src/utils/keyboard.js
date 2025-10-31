// Keyboard utility helpers for consistent shortcut handling
export const normalizeKeyEvent = (event) => {
  const parts = []

  if (event.ctrlKey) parts.push('ctrl')
  if (event.shiftKey) parts.push('shift')
  if (event.altKey) parts.push('alt')
  if (event.metaKey) parts.push('meta')

  let keyPart = ''

  if (event.code) {
    if (event.code.startsWith('Key') && event.code.length === 4) {
      keyPart = event.code.slice(3).toLowerCase()
    } else if (event.code.startsWith('Digit') && event.code.length === 6) {
      keyPart = event.code.slice(5)
    } else {
      const mapped = mapCodeToKey(event.code, event)
      if (mapped) {
        keyPart = mapped
      }
    }
  }

  if (!keyPart && event.key) {
    keyPart = mapKeyString(event.key)
  }

  if (keyPart) {
    parts.push(keyPart)
  }

  return parts.join('+')
}

export const normalizeShortcutString = (shortcut = '') =>
  shortcut
    .split('+')
    .map(segment => segment.trim().toLowerCase())
    .filter(Boolean)
    .join('+')

const mapCodeToKey = (code, event) => {
  switch (code) {
    case 'Space':
      return 'space'
    case 'Backspace':
      return 'backspace'
    case 'Delete':
      return 'delete'
    case 'Enter':
    case 'NumpadEnter':
      return 'enter'
    case 'Escape':
      return 'escape'
    case 'Tab':
      return 'tab'
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      return code.toLowerCase()
    case 'NumpadAdd':
      return 'plus'
    case 'NumpadSubtract':
      return 'minus'
    case 'NumpadMultiply':
      return 'asterisk'
    case 'NumpadDivide':
      return 'slash'
    default:
      if (code.startsWith('Numpad') && code.length === 7) {
        return code.slice(6)
      }
      if (code === 'Equal' && event.shiftKey) {
        return 'plus'
      }
      if (code === 'Minus' && event.shiftKey) {
        return 'underscore'
      }
      if (code === 'Minus') {
        return 'minus'
      }
      if (code === 'Equal') {
        return 'equals'
      }
      return ''
  }
}

const mapKeyString = (key) => {
  const lower = key.length === 1 ? key.toLowerCase() : key.toLowerCase()

  switch (lower) {
    case '+':
      return 'plus'
    case '-':
      return 'minus'
    case '*':
      return 'asterisk'
    case '/':
      return 'slash'
    case ' ':
      return 'space'
    default:
      return lower
  }
}
