import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).end();
  
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment`);
  res.send(Buffer.from(buffer));
}