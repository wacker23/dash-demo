import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest } from '../../../lib/server';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await handleRequest(req, 'place');
  const data = await result.json();
  res.status(result.status).json(data);
}
