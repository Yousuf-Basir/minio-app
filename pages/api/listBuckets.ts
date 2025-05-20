import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { listBuckets } from '../../utils/awsS3Client';

type Data = {
  buckets?: AWS.S3.Bucket[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Use the reusable S3 client to list all buckets
    const data = await listBuckets();
    
    // Return the buckets
    return res.status(200).json({ buckets: data.Buckets });
  } catch (error: any) {
    console.error('Failed to list buckets:', error);
    return res.status(500).json({ error: error.message });
  }
}
