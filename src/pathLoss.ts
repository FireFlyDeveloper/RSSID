// pathLoss.ts
import { TX_POWER, PATH_LOSS_EXPONENT } from "./config";

export function rssiToDistance(rssi: number): number {
  // Log-distance path-loss model: distance = 10 ^ ((TX_POWER - rssi) / (10 * n))
  const ratio = (TX_POWER - rssi) / (10 * PATH_LOSS_EXPONENT);
  return Math.pow(10, ratio);
}
