export type DispalyDeviceInfoDto = {
  id: string; // Firestore document ID
  deviceid: number; // This is the internal device ID from Firestore
  equipment_id: number;
  equipment_type: string;
  current_red: number;
  current_green: number;
  off_current_red: number;
  off_current_green: number;
  voltage_red: number;
  voltage_green: number;
  temperature: number;
  updated_at: Date;
};