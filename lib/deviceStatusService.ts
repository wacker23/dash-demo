import { getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

type WarningLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';

interface Warning {
  level: WarningLevel;
  message: string;
}

export interface DeviceStatus {
  deviceId: number;
  avgGreen: number;
  avgRed: number;
  greenWarning: Warning;
  redWarning: Warning;
  hasWarning: boolean;
}

const getGreenWarning = (avg: number): Warning => {
  if (avg < 497) return { level: 'high', message: '6+ devices not working properly (Green)' };
  if (avg >= 560 && avg <= 770) return { level: 'medium', message: '2-5 devices not working properly (Green)' };
  if (avg >= 875 && avg <= 896) return { level: 'none', message: 'All good (Green)' };
  return { level: 'unknown', message: 'Unknown status (Green)' };
};

const getRedWarning = (avg: number): Warning => {
  if (avg >= 925 && avg <= 935) return { level: 'none', message: 'All good (Red)' };
  if (avg >= 864 && avg <= 870) return { level: 'low', message: '1 device not working properly (Red)' };
  if (avg >= 790 && avg <= 796) return { level: 'medium', message: '2 devices not working properly (Red)' };
  if (avg >= 648 && avg <= 729) return { level: 'high', message: '3-4 devices not working properly (Red)' };
  if (avg < 576) return { level: 'critical', message: '5+ devices not working properly (Red)' };
  return { level: 'unknown', message: 'Unknown status (Red)' };

};

export const fetchDeviceStats = async (deviceId: number): Promise<DeviceStatus> => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const q = query(
      collection(db, 'mqtt_db'),
      where('deviceid', '==', deviceId),
      where('updated_at', '>=', Timestamp.fromDate(oneDayAgo)),
      where('updated_at', '<=', Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);
    let totalGreen = 0;
    let totalRed = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalGreen += data.current_green || 0;
      totalRed += data.current_red || 0;
      count++;
    });

    const avgGreen = count > 0 ? totalGreen / count : 0;
    const avgRed = count > 0 ? totalRed / count : 0;

    const greenWarning = getGreenWarning(avgGreen);
    const redWarning = getRedWarning(avgRed);

    return {
      deviceId,
      avgGreen,
      avgRed,
      greenWarning,
      redWarning,
      hasWarning: greenWarning.level !== 'none' || redWarning.level !== 'none'
    };
  } catch (error) {
    console.error('Error fetching device stats:', error);
    throw error;
  }
};

export const checkAllDeviceWarnings = async (deviceIds: number[]): Promise<Record<number, boolean>> => {
  const warnings: Record<number, boolean> = {};
  
  for (const deviceId of deviceIds) {
    try {
      const stats = await fetchDeviceStats(deviceId);
      warnings[deviceId] = stats.hasWarning;
    } catch (error) {
      console.error(`Error checking warnings for device ${deviceId}:`, error);
      warnings[deviceId] = false;
    }
  }
  
  return warnings;
};