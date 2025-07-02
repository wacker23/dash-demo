import { EquipmentTypeKey } from './constants';
import { EquipmentStatusDto } from './equipment-status.dto';

export interface SearchDeviceDto {
  id: number;
  equipment_type: EquipmentTypeKey;
  interval: number;
  latitude: number;
  longitude: number;
  device_state: 'normal' | 'warn' | 'emergency' | 'blank';
  manufacturing_date: string;
  order_date: string;
  company: {name: string};
  status: EquipmentStatusDto[];
  statusRange?: {
    start: string;
    end: string;
  };
  statusCount: number;
  next: boolean;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  is_active: boolean;
}
