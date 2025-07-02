import type { NextApiRequest, NextApiResponse } from 'next';
import {API_URI} from '../../lib/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies['HANLAID'];
  // fetch data from API
  const result = await fetch(`${API_URI}/auth/verify`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await result.json();
  res.status(result.status).json(data);
}
