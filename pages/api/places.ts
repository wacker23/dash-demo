import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import {API_URI} from '../../lib/server';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.cookies['HANLAID'] || '';
  const id = req.query.id ? req.query.id[0] : '';

  // fetch data from API
  const result = await fetch(`${API_URI}/place/all`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await result.json();
  res.status(result.status).json(data);
}
