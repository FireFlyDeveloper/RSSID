// outlier.ts
export class PositionFilter {
    private history: { x: number; y: number }[] = [];
  
    constructor(private readonly maxLen: number, private readonly threshold: number) {}
  
    /** 
     * Check if new position (x,y) is within the allowed distance (threshold) of
     * the moving average of recent positions. If yes, update history and return true.
     * If not, return false.
     */
    checkAndUpdate(x: number, y: number): boolean {
      if (this.history.length >= this.maxLen) {
        const avg = this.history.reduce((acc, p) => ({
          x: acc.x + p.x,
          y: acc.y + p.y,
        }), { x: 0, y: 0 });
        avg.x /= this.history.length;
        avg.y /= this.history.length;
        const dx = x - avg.x;
        const dy = y - avg.y;
        const dist = Math.hypot(dx, dy);
        if (dist > this.threshold) {
          return false; // New position is an outlier
        }
        this.history.shift();
      }
      this.history.push({ x, y });
      if (this.history.length > this.maxLen) {
        this.history.shift();
      }
      return true;
    }
  }
  