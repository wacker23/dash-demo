export default interface OrganizationDto {
  id: number;
  name: string;
  privileged: boolean;
  center_x?: number;
  center_y?: number;
  is_active: boolean;
}
