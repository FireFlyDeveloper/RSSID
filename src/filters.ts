// filters.ts
export class MovingAverageFilter {
    private window: number[];
    
    constructor(private readonly windowSize: number) {
      this.window = [];
    }
    
    /** Update the filter with a new sample and return the moving average. */
    update(value: number): number {
      this.window.push(value);
      if (this.window.length > this.windowSize) {
        this.window.shift();
      }
      const sum = this.window.reduce((acc, val) => acc + val, 0);
      return sum / this.window.length;
    }
  }
  
  export class KalmanFilter1D {
    private x: number; // State estimate
    private P: number; // Estimate covariance
    constructor(private readonly R: number, private readonly Q: number) {
      this.x = 0;
      this.P = 1;
    }
    
    /** Process a measurement z and return the filtered value. */
    update(z: number): number {
      // Predict
      const x_prior = this.x;
      const P_prior = this.P + this.Q;
      // Compute Kalman gain
      const K = P_prior / (P_prior + this.R);
      // Update estimate with measurement z
      this.x = x_prior + K * (z - x_prior);
      // Update covariance
      this.P = (1 - K) * P_prior;
      return this.x;
    }
  }
  