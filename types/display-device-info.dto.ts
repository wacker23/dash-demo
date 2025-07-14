export interface DispalyDeviceInfoDto {
  no: number;
  idDevice: number;
  voltR?: number; // Maps to voltage_red
  voltG?: number; // Maps to voltage_green
  currR?: number; // Maps to current_red
  currG?: number; // Maps to current_green
  offCurrR?: number; // Maps to off_current_red
  offCurrG?: number; // Maps to off_current_green
  temp?: number; // Maps to temperature
  receive_date: Date; // Maps to updated_at
}