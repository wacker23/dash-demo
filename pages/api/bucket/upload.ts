import type { NextApiRequest, NextApiResponse } from 'next';
import fetch, { FormData, Blob } from 'node-fetch';
import { API_URI } from '../../../lib/server';

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
  const {filename, contentType, data: base64} = JSON.parse(req.body);
  const image_data = Buffer.from(base64, 'base64');
  const blob = new Blob([image_data], {type: contentType});
  const formData = new FormData();
  formData.append('blob', blob);

  const response = await fetch(`${API_URI}/bucket/upload`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
