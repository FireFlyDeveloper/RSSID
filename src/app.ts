// main.ts
import mqtt from "mqtt";
import { MovingAverageFilter, KalmanFilter1D } from "./filters";
import { PositionFilter } from "./outlier";
import { trilaterate, Point } from "./trilateration";
import { rssiToDistance } from "./pathLoss";

// ----- Configuration -----
// Filter switches and parameters
const USE_MOVING_AVERAGE = true;
const USE_KALMAN = true;
const MA_WINDOW_SIZE = 5;
const KALMAN_R = 0.5;
const KALMAN_Q = 0.2;

// Outlier rejection settings
const POSITION_HISTORY_LENGTH = 5;
const OUTLIER_THRESHOLD = 1.0; // in meters

// MQTT settings
const brokerUrl = "mqtt://security.local";

// ----- Data Structures -----
// For each beacon (identified by its MAC), maintain per-anchor filters.
interface BeaconFilters {
  [anchorId: number]: {
    maFilter?: MovingAverageFilter;
    kalmanFilter?: KalmanFilter1D;
  };
}
const beaconFilters: Map<string, BeaconFilters> = new Map();

// Latest computed distance per beacon per anchor
interface BeaconDistances {
  [anchorId: number]: number;
}
const latestDistances: Map<string, BeaconDistances> = new Map();

// Position filtering per beacon (for outlier rejection)
const beaconPositionFilter: Map<string, PositionFilter> = new Map();

// ----- MQTT Client Setup -----
const client = mqtt.connect(brokerUrl);
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("esp32_1/rssi");
  client.subscribe("esp32_2/rssi");
  client.subscribe("esp32_3/rssi");
  client.subscribe("esp32_4/rssi");
});

// ----- MQTT Message Handler -----
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    // Expected JSON format:
    // { "mac": "AA:BB:CC:DD:EE:FF", "rssi": -65, "timestamp": 1620000000000, "major": 0, "minor": 0, "esp": 2 }
    const { mac, rssi, esp, timestamp } = data;
    const beaconId = mac; // Unique beacon identifier
    const anchorId: number = esp;

    if (beaconId === "5B:76:29:38:17:6F".toLowerCase()) return;

    // Initialize filters and position filter per beacon if needed
    if (!beaconFilters.has(beaconId)) {
      beaconFilters.set(beaconId, {});
      beaconPositionFilter.set(beaconId, new PositionFilter(POSITION_HISTORY_LENGTH, OUTLIER_THRESHOLD));
    }
    const filters = beaconFilters.get(beaconId)!;
    if (!filters[anchorId]) {
      filters[anchorId] = {
        maFilter: USE_MOVING_AVERAGE ? new MovingAverageFilter(MA_WINDOW_SIZE) : undefined,
        kalmanFilter: USE_KALMAN ? new KalmanFilter1D(KALMAN_R, KALMAN_Q) : undefined,
      };
    }
    let currentValue = rssi;
    const rawRssi = rssi;
    let movingAvg: number = currentValue;
    let kalmanFiltered: number = currentValue;

    if (USE_MOVING_AVERAGE && filters[anchorId].maFilter) {
      movingAvg = filters[anchorId].maFilter.update(currentValue);
      currentValue = movingAvg;
    }
    if (USE_KALMAN && filters[anchorId].kalmanFilter) {
      kalmanFiltered = filters[anchorId].kalmanFilter.update(currentValue);
      currentValue = kalmanFiltered;
    }

    // Convert the filtered RSSI value to an estimated distance.
    const distance = rssiToDistance(currentValue);

    // Diagnostics log for this update
    console.log(JSON.stringify({
      beacon: beaconId,
      anchor: anchorId,
      timestamp: timestamp,
      rawRssi: rawRssi,
      movingAverageRssi: USE_MOVING_AVERAGE ? movingAvg : undefined,
      kalmanFilteredRssi: USE_KALMAN ? kalmanFiltered : undefined,
      computedDistance: distance
    }));

    // Update the latest distances for this beacon
    if (!latestDistances.has(beaconId)) {
      latestDistances.set(beaconId, {});
    }
    const distances = latestDistances.get(beaconId)!;
    distances[anchorId] = distance;

    // If we have received distances from at least three anchors, run trilateration.
    if (Object.keys(distances).length >= 3) {
      const pos: Point | null = trilaterate(distances);
      if (pos) {
        // Use outlier rejection to reject spurious positions.
        const posFilter = beaconPositionFilter.get(beaconId)!;
        if (posFilter.checkAndUpdate(pos.x, pos.y)) {
          console.log(`Beacon ${beaconId} estimated position: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
        } else {
          console.warn(`Outlier position for beacon ${beaconId} rejected: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
        }
      }
    }
  } catch (err) {
    console.error("Error processing MQTT message:", err);
  }
});
