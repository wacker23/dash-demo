
export interface UserMenu {
  name: string;
  path: string;
}

export interface SignInDto {
  need_2fa: boolean;
  access_token?: string;
  expiry_time?: Date;
}

export interface SignInErrorDto {
  description: string;
}

export default interface UserDto {
  name: string,
  role: string,
  privileged: boolean,
  organization: string,
  logo_uri: string,
  menus: UserMenu[],
}
