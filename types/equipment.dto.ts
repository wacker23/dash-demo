import {EquipmentStatusDto} from './equipment-status.dto';
import { EquipmentTypeKey } from './constants';

export interface EquipmentDto {
  id: number;
  equipment_type: EquipmentTypeKey;
  interval: number;
  modem_id: string;
  units: number;
  address: string;
  latitude: number;
  longitude: number;
  device_state: 'normal' | 'warn' | 'emergency' | 'blank';
  manufacturing_date: string;
  order_date: string;
  company: {name: string};
  location: {
    name: string,
    latitude: number,
    longitude: number
  };
  status: EquipmentStatusDto[];
  statusRange: {
    start: string;
    end: string;
  };
  statusCount: number;
  next: boolean;
  memo: string;
  is_active: boolean;
}
