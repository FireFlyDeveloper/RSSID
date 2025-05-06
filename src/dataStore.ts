// dataStore.ts
import { rssiToDistance } from "./pathLoss";

// For each beacon, store recent RSSI readings per anchor
interface BeaconRssiData {
  [anchorId: number]: number[];
}

export class BeaconTracker {
  private windowSize: number = 5;
  private data: Map<string, BeaconRssiData> = new Map();

  // Add a new RSSI reading for a beacon seen by anchorId
  public update(beaconId: string, anchorId: number, rssi: number): void {
    if (!this.data.has(beaconId)) {
      this.data.set(beaconId, {});
    }
    const beaconData = this.data.get(beaconId)!;
    if (!beaconData[anchorId]) {
      beaconData[anchorId] = [];
    }
    beaconData[anchorId].push(rssi);
    if (beaconData[anchorId].length > this.windowSize) {
      beaconData[anchorId].shift(); // keep only the latest windowSize samples
    }
  }

  // Calculate average RSSI per anchor, then convert to distance
  public getAverageDistances(beaconId: string): { [anchorId: number]: number } | null {
    const beaconData = this.data.get(beaconId);
    if (!beaconData) {
      return null;
    }
    const distances: { [anchorId: number]: number } = {};
    for (const anchorId of Object.keys(beaconData).map(Number)) {
      const readings = beaconData[anchorId];
      if (readings && readings.length > 0) {
        // Compute average RSSI
        const sum = readings.reduce((a, b) => a + b, 0);
        const avgRssi = sum / readings.length;
        // Convert to distance
        distances[anchorId] = rssiToDistance(avgRssi);
      }
    }
    return distances;
  }
}
