import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import {API_URI} from '../../lib/server';

interface ResponseData {
  need_2fa: boolean;
  access_token?: string;
  expiry_time?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // fetch data from API
  const result = await fetch(`${API_URI}/auth/signIn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  const data = await result.json() as ResponseData;
  if (result.status === 200) {
    if (!data.need_2fa && data.access_token) {
      res.setHeader('Set-Cookie', `HANLAID=${data.access_token}; HttpOnly; Path=/;`);
    }
  }
  res.status(result.status).json(data);
}
