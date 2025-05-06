// config.ts
export const anchorPositions: { [id: number]: { x: number; y: number } } = {
    1: { x: 0,  y: 0  },  // Anchor 1: bottom‐left
    2: { x: 10, y: 0  },  // Anchor 2: bottom‑right
    3: { x: 10, y: 5  },  // Anchor 3: top‑right
    4: { x: 0,  y: 5  },  // Anchor 4: top‑left
  };
  
  export const TX_POWER = -59;        // Reference RSSI (dBm) at 1 meter
  export const PATH_LOSS_EXPONENT = 2.0; // Path-loss exponent (typically 2 for free-space)
  