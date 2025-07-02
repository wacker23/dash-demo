import type { NextApiRequest } from 'next';
import fetch from 'node-fetch';

export const API_URI = process.env.API_URI ?? 'https://api.stl1.co.kr';

export const KAKAO_API_KEY = process.env.KAKAO_KEY ?? '';

export const handleRequest = async (req: NextApiRequest, mode: string) => {
  const {uri, ...query} = req.query;
  const path = uri as string[];
  let queryString = Object.keys(query).map(key => `${key}=${query[key]}`).join('&');
  queryString = queryString === '' ? '' : `?${queryString}`;
  const token = req.cookies['HANLAID'] || '';

  return await fetch(`${API_URI}/${mode}/${path.join('/')}${queryString}`, {
    method: req.method || 'GET',
    headers: req.method !== 'GET' ? {
      "Authorization": `Bearer ${token}`,
      'Content-Type': req.headers['content-type'] ?? 'application/json',
      'Content-Length': req.headers['content-length'] ?? req.body?.length,
    } : {
      "Authorization": `Bearer ${token}`,
    },
    body: req.method !== 'GET' ?
      req.headers['content-type']?.includes('multipart/form-data') ?
        req.body :
        JSON.stringify(req.body) :
      undefined,
  });
};
