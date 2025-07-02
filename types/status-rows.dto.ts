export interface StatusRowsDto {
  id: number;
  voltR?: number;
  voltG?: number;
  ampR?: number;
  ampG?: number;
  dutyR?: number;
  dutyG?: number;
  outStat?: number;
  tempStat?: number;
  dirStat?: number;
  modeStat?: number;
  commStat?: number;
  state: 'normal' | 'abnormal' | 'fault';
  abnormal: boolean;
  receive_date: Date;
}
