
export interface EquipmentStatusDto {
  id: number;
  rawData: string;
  state: 'normal' | 'abnormal' | 'fault';
  abnormal: boolean;
  receive_date: string;
}
