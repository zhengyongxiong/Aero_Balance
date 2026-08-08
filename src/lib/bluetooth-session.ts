import type { BluetoothConnection } from "./bluetooth";

let activeConnection: BluetoothConnection | null = null;

export const getActiveBluetoothConnection = () => activeConnection;

export const setActiveBluetoothConnection = (
  connection: BluetoothConnection | null,
) => {
  activeConnection = connection;
};

export const clearActiveBluetoothConnection = (
  connection: BluetoothConnection,
) => {
  if (activeConnection === connection) activeConnection = null;
};
