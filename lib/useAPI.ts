import useSWR from 'swr';
import { EquipmentDto } from '../types/equipment.dto';
import { useCallback, useEffect, useState } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { createStatusCols } from './createCols';
import { EquipmentStatusDto } from '../types/equipment-status.dto';
import { StatusRowsDto } from '../types/status-rows.dto';
import toStatusRows from './toStatusRows';
import { EquipmentTypeKey } from '../types/constants';
import { number } from 'prop-types';
import { SearchDeviceDto } from '../types/search-device.dto';
import { useSession } from './useSession';
import { DispalyDeviceInfoDto } from '../types/display-device-info.dto';


import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';


interface PlaceData {
  id: number;
  name: string;
  state: 'normal' | 'warn' | 'emergency';
  latitude: number;
  longitude: number;
  equipments: EquipmentDto[];
  installCompany: { name: string };
  manageCompany: { name: string };
  install_date: string;
}

interface DailyLog {
  count: number;
  status: EquipmentStatusDto[];
}

const decomposeId = (id: string): [EquipmentTypeKey, string] => {
  const regex = new RegExp('(AGL|DGL|VGL|BGL|LGL)(\\d+)', 'g');
  const match = regex.exec(id);
  if (match) {
    const type = match[1] as EquipmentTypeKey;
    const id = match[2];
    return [type, id];
  } else {
    return ['AGL', ''];
  }
};

const useAPI = <T = any>(path: string) => {
  const {data, error, isLoading} = useSWR<T>(`/api${path}`);

  return {
    data,
    error,
    isLoading,
  };
}

export const usePlaces = () => {
  const session = useSession();
  const {data, error} = useSWR<PlaceData[]>(session.isLoggedIn ? '/api/places' : null);

  return {
    places: data ?? [],
    isLoading: !error && !data,
  };
};

export const useDeviceList = () => {
  const {data, error} = useSWR<EquipmentDto[]>('/api/device/all');

  return {
    devices: data,
    isLoading: !error && !data,
  }
}

export const useEquipmentInfo = (id: string) => {
  const {data, error, isLoading} = useSWR<EquipmentDto>(
    id.trim() !== '' ? `/api/device/${id}` : null,
  );
  const [hasFound, setHasFound] = useState(false);
  const [statusCols, setStatusCols] = useState<GridColDef[]>([]);
  const [statusRows, setStatusRows] = useState<StatusRowsDto[]>([]);

  useEffect(() => {
    if (data && "equipment_type" in data) {
      if (!isLoading) {
        setStatusCols(createStatusCols(data.equipment_type));
      }
      setHasFound(true);
    } else {
      setHasFound(false);
    }
  }, [data, isLoading]);

  return {
    device: data,
    isLoading: !error && !data,
    hasFound,
  };
};



const parseId = (id: string): [string, number] => {
  const regex = /^([A-Z]+)(\d+)$/i;
  const match = regex.exec(id.trim());
  if (!match) return ['', -1];
  return [match[1], parseInt(match[2], 10)];
};

export const useEquipmentDisplayInfo = (id: string) => {
  const [displayInfo, setDisplayInfo] = useState<DispalyDeviceInfoDto[]>([]);
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  const [overallWarning, setOverallWarning] = useState<DeviceStatus['warningLevel']>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [type, numericId] = parseId(id);

  const load = useCallback(async () => {
    if (!type || numericId <= 0) {
      console.warn(`[DisplayInfo] Invalid ID parsed: type=${type}, numericId=${numericId}`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const colRef = collection(db, 'mqtt_db');
      const q = query(
        colRef,
        where('equipment_type', '==', type),
        where('equipment_id', '==', numericId),
        orderBy('updated_at', 'desc')
      );

      const snapshot = await getDocs(q);
const result: DispalyDeviceInfoDto[] = snapshot.docs.map(doc => {
  const data = doc.data() as DocumentData;
  return {
    id: doc.id,
    deviceid: data.deviceid ?? 'unknown',
    temperature: data.temperature,
    current_red: data.current_red,
    current_green: data.current_green,
    off_current_red: data.off_current_red,
    off_current_green: data.off_current_green,
    voltage_red: data.voltage_red,
    voltage_green: data.voltage_green,
    equipment_id: data.equipment_id,
    equipment_type: data.equipment_type,
    updated_at: typeof data.updated_at === 'string'
      ? new Date(data.updated_at)
      : data.updated_at?.toDate?.() ?? new Date(), // fallback for Firestore Timestamp
  };
});


      const statuses = calculateDeviceStatuses(result);
      setDeviceStatuses(statuses);

      const levels = statuses.map(d => d.warningLevel);
      if (levels.includes('critical')) setOverallWarning('critical');
      else if (levels.includes('high')) setOverallWarning('high');
      else if (levels.includes('medium')) setOverallWarning('medium');
      else if (levels.includes('low')) setOverallWarning('low');
      else setOverallWarning('none');

      setDisplayInfo(result);
    } catch (err) {
      console.error('[DisplayInfo] Error loading data from Firestore:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [type, numericId, id]);

  const clear = () => {
    setDisplayInfo([]);
    setDeviceStatuses([]);
    setOverallWarning('none');
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    displayInfo,
    deviceStatuses,
    overallWarning,
    isLoading,
    error,
    load,
    clear,
  };
};


export const useEquipmentDailyLog = (id: string) => {
  const [equipType,] = decomposeId(id);
  const [key, setKey] = useState<string | null>(null);
  const [dailyLog, setDailyLog] = useState<StatusRowsDto[]>([]);
  const [isReady, setIsReady] = useState(false);
  const {data, error, mutate} = useSWR<DailyLog>(key, {refreshInterval: 5000});

  const clear = () => {
    setKey(null);
    setIsReady(false);
    setDailyLog([]);
  };

  const loadDailyLog = useCallback(async (start?: string, end?: string) => {
    setKey(() => {
      if (start && end) {
        return `/api/device/${id}/dailyStatus?start=${start}&end=${end}&is_normal=false`;
      } else if (id.trim() !== '') {
        return `/api/device/${id}/dailyStatus?is_normal=false`;
      } else {
        return null;
      }
    });
  }, [id]);

  useEffect(() => {
    if (equipType.trim() !== '' && data && data.status) {
      const rows = toStatusRows(equipType, data.status);
      setDailyLog(
        rows.map(row =>
          Object.assign({
            ...row,
            receive_date: new Date(row.receive_date)
          }),
        ));
      setIsReady(true);
    } else {
      setDailyLog([]);
    }
  }, [data, equipType]);

  return {
    clear,
    dailyLog,
    isLoading: !error && !data,
    isReady,
    loadDailyLog,
  }
};

export const useEquipmentStatus = (id: string) => {
  const [equipType,] = decomposeId(id);
  const [key, setKey] = useState(
    id.trim() !== '' ? `/api/device/${id}/status` : null,
  );
  const [statusRows, setStatusRows] = useState<StatusRowsDto[]>([]);
  const {data, error} = useSWR<EquipmentStatusDto[]>(key, {refreshInterval: 5000});

  const clear = () => {
    setKey(null);
    setStatusRows([]);
  };

  const loadPage = useCallback(async (page?: number) => {
    setKey(() => {
      if (page) {
        return `/api/device/${id}/status?page=${page}`;
      } else if (id.trim() !== '') {
        return `/api/device/${id}/status`;
      } else {
        return null;
      }
    });
  }, [id]);

  useEffect(() => {
    if (equipType.trim() !== '' && data) {
      const rows = toStatusRows(equipType, data);
      setStatusRows(
        rows.map(row =>
          Object.assign({
            ...row,
            receive_date: new Date(row.receive_date)
          }),
        ));
    }
  }, [data, equipType, id]);

  return {
    clear,
    status: statusRows,
    isLoading: !error && !data,
    loadPage,
  }
};

export const useSearchAddr = (addr: string) => {
  const session = useSession();
  const [key, setKey] = useState(
    addr.trim() !== '' ? `/api/device/search/address=${addr}` : null,
  );
  const [rows, setRows] = useState<SearchDeviceDto[]>([]);
  const {data, error} = useSWR<SearchDeviceDto[]>(session.isLoggedIn ? key : null, {refreshInterval: 5000});

  const clear = () => {
    setKey(null);
    setRows([]);
  };

  const loadPage = useCallback((addr: string, page?: number) => {
    setKey(() => {
      if (page) {
        return `/api/device/search/address=${addr}?page=${page}`;
      } else if (addr.trim() !== '') {
        return `/api/device/search/address=${addr}`;
      } else {
        return null;
      }
    });
  }, []);

  useEffect(() => {
    if (!error && data) {
      setRows(data);
    }
  }, [error, data]);

  return {
    clear,
    isLoading: !error && !data,
    searchData: rows,
    loadPage,
  }
};


// Update the DeviceStatus interface to use number for deviceid
interface DeviceStatus {
  deviceid: number;  // Changed from string to number
  avgCurrentRed: number;
  avgCurrentGreen: number;
  warningLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  warningMessage: string;
}

// Updated calculateDeviceStatuses function
const calculateDeviceStatuses = (displayInfo: DispalyDeviceInfoDto[]): DeviceStatus[] => {
  const deviceMap = new Map<number, { red: number[]; green: number[] }>(); // Changed to number

  // Group data by deviceid and collect all current values
  displayInfo.forEach(item => {
    const deviceIdNum = Number(item.deviceid); // Convert deviceid to number
    if (isNaN(deviceIdNum)) return; // Skip if invalid number
    
    if (!deviceMap.has(deviceIdNum)) {
      deviceMap.set(deviceIdNum, { red: [], green: [] });
    }
    const deviceData = deviceMap.get(deviceIdNum)!;
    if (item.current_red !== undefined) deviceData.red.push(item.current_red);
    if (item.current_green !== undefined) deviceData.green.push(item.current_green);
  });

  // Calculate averages and determine warning levels
  const result: DeviceStatus[] = [];
  
  deviceMap.forEach((values, deviceid) => {
    const avgRed = values.red.length > 0 ? 
      values.red.reduce((sum, val) => sum + val, 0) / values.red.length : 0;
    const avgGreen = values.green.length > 0 ? 
      values.green.reduce((sum, val) => sum + val, 0) / values.green.length : 0;

    let warningLevel: DeviceStatus['warningLevel'] = 'none';
    let warningMessage = '장치가 제대로 작동함';

    // Determine warning level based on green current
    if (avgGreen < 497) {
      warningLevel = 'critical';
      warningMessage = '장치의 녹색 색상이 제대로 작동하지 않습니다.';
    } else if (avgGreen >= 560 && avgGreen <= 770) {
      warningLevel = 'high';
      warningMessage = '장치의 녹색 색상이 제대로 작동하지 않습니다.';
    } else if (avgGreen >= 875 && avgGreen <= 896) {
     // warningLevel = 'none';
      warningMessage = '장치가 제대로 작동함';
    }

    // Override with more critical warning if red current indicates worse condition
    if (avgRed >= 925 && avgRed <= 935) {
      // All good - keep previous warning
    // } else if (avgRed >= 864 && avgRed <= 870) {
    //   if (warningLevel === 'none') {
    //     warningLevel = 'low';
    //     warningMessage = '1 device doesn\'t work properly';
    //   }
     } 
    else if (avgRed >= 790 && avgRed <= 796) {
      if (warningLevel !== 'critical' && warningLevel !== 'high') {
        warningLevel = 'medium';
        warningMessage = '기기의 빨간색은 제대로 작동하지 않습니다';
      }
    } else if (avgRed >= 648 && avgRed <= 729) {
      if (warningLevel !== 'critical') {
        warningLevel = 'high';
        warningMessage = '기기의 빨간색은 제대로 작동하지 않습니다';
      }
    } else if (avgRed < 576) {
      warningLevel = 'critical';
      warningMessage = '기기의 빨간색은 제대로 작동하지 않습니다';
    }

    result.push({
      deviceid, // Now correctly typed as number
      avgCurrentRed: avgRed,
      avgCurrentGreen: avgGreen,
      warningLevel,
      warningMessage
    });
  });

  return result;
};

export default useAPI;