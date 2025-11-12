import type { NextApiRequest, NextApiResponse } from 'next';
import {API_URI} from '../../lib/server';
import UserDto from '../../types/user.dto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies['HANLAID'];
  // fetch data from API
  const result = await fetch(`${API_URI}/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const user = await result.json() as UserDto;
  const menus = user.privileged ? [
      {
        name: '모듈 상태',
        path: '/mgmt/device/interval',
      },
      {
        name: '조직 관리',
        path: '/mgmt/Organization',
      },
      {
        name: '사용자 관리',
        path: '/mgmt/Users',
      }
  ] : user.role.toLowerCase() === 'admin' ? [
    {
      name: '사용자 관리',
      path: '/mgmt/Users',
    }
  ] : [];
  res.status(result.status).json({ ...user, menus });
}
