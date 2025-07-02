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

export default useAPI;
