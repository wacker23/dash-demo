import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import {API_URI} from '../../../lib/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const result = await fetch(`${API_URI}/mqtt/interval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.body,
    });
    const data = await result.json();
    res.status(result.status).json(data);
  }
  res.status(500).end();
}
