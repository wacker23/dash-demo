import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userAgent = req.headers['user-agent'] ?? '';
  const [, browserName, browserVersion] = userAgent.match(/(opera|edg|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  const [, osName] = userAgent.match(/((?=windows|macintosh|linux).*?);/i) || [];

  // generate udid
  const udid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  res.status(200).json({
    success: true,
    udid,
    userAgent,
  });
}
