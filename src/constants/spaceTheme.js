// Space/Sci-Fi Theme Constants
export const SPACE_COLORS = {
  // Primary Space Colors
  deepSpace: '#0A0E27',
  nebulaPurple: '#8A2BE2',
  cosmicBlue: '#00BFFF',
  starWhite: '#F0F9FF',
  spaceGray: '#1A1F3A',

  // Circuit Board PCB Colors
  pcbGreen: '#1B5E20',
  pcbDarkGreen: '#0F3A0F',
  copperTrace: '#B87333',
  goldContact: '#FFD700',
  silverSolder: '#C0C0C0',

  // Gate Type Colors (Circuit Board Style)
  gates: {
    AND: {
      base: '#2E7D32',      // PCB Green
      glow: '#4CAF50',      // Bright Green
      trace: '#FFD700',     // Gold traces
      led: '#00FF00'        // LED Green
    },
    OR: {
      base: '#1565C0',      // Deep Blue
      glow: '#42A5F5',      // Bright Blue
      trace: '#FFD700',     // Gold traces
      led: '#00BFFF'        // Cyan LED
    },
    NOT: {
      base: '#C62828',      // Deep Red
      glow: '#EF5350',      // Bright Red
      trace: '#FFD700',     // Gold traces
      led: '#FF0000'        // LED Red
    },
    XOR: {
      base: '#6A1B9A',      // Deep Purple
      glow: '#AB47BC',      // Bright Purple
      trace: '#FFD700',     // Gold traces
      led: '#FF00FF'        // Magenta LED
    },
    NAND: {
      base: '#E65100',      // Deep Orange
      glow: '#FF9800',      // Bright Orange
      trace: '#FFD700',     // Gold traces
      led: '#FFA500'        // Orange LED
    },
    NOR: {
      base: '#AD1457',      // Deep Pink
      glow: '#EC407A',      // Bright Pink
      trace: '#FFD700',     // Gold traces
      led: '#FF69B4'        // Hot Pink LED
    },
    INPUT: {
      base: '#004D40',      // Teal
      glow: '#00BFA5',      // Bright Teal
      trace: '#FFD700',     // Gold traces
      led: '#00FFFF'        // Aqua LED
    },
    OUTPUT: {
      base: '#3E2723',      // Brown
      glow: '#8D6E63',      // Light Brown
      trace: '#FFD700',     // Gold traces
      led: '#FFFF00'        // Yellow LED
    },
    CLOCK: {
      base: '#263238',      // Blue Grey
      glow: '#607D8B',      // Light Blue Grey
      trace: '#FFD700',     // Gold traces
      led: '#00FF00',       // Green LED
      pulse: '#00FFFF'      // Pulse Cyan
    }
  },

  // Signal States
  signalActive: '#00FF00',   // Bright Green
  signalInactive: '#4A5568', // Gray
  signalPulse: '#00FFFF',    // Cyan

  // UI Elements
  ui: {
    panelBg: 'rgba(26, 31, 58, 0.95)',
    panelBorder: 'rgba(0, 191, 255, 0.3)',
    buttonBg: 'rgba(138, 43, 226, 0.2)',
    buttonHover: 'rgba(138, 43, 226, 0.4)',
    buttonActive: 'rgba(138, 43, 226, 0.6)',
    textPrimary: '#F0F9FF',
    textSecondary: '#94A3B8',
    success: '#00FF00',
    warning: '#FFD700',
    danger: '#FF4444',
    info: '#00BFFF'
  },

  // Effects
  effects: {
    particleColors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00'],
    sparkColor: '#FFF',
    glowColor: 'rgba(0, 255, 255, 0.5)',
    traceGlow: 'rgba(255, 215, 0, 0.6)'
  }
};

// Animation Timings
export const ANIMATIONS = {
  wirePulse: '0.5s',
  gatePulse: '0.3s',
  particleBurst: '1s',
  signalFlow: '0.8s',
  hover3D: '0.2s',
  clockTick: '500ms'
};

// 3D Transform Values
export const TRANSFORMS = {
  hoverScale: 1.1,
  activeScale: 0.95,
  perspective: '1000px',
  rotateX: '15deg',
  rotateY: '15deg',
  depth: '10px'
};

// Sound File Names (to be added in public/sounds/)
export const SOUNDS = {
  gateClick: 'gate-click.mp3',
  wireConnect: 'wire-connect.mp3',
  signalPass: 'signal-pass.mp3',
  achievement: 'achievement.mp3',
  levelComplete: 'level-complete.mp3',
  error: 'error.mp3',
  ambientSpace: 'ambient-space.mp3',
  clockTick: 'clock-tick.mp3'
};