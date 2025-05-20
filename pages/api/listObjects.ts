import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { listObjects } from '../../utils/awsS3Client';

type Data = {
  objects?: AWS.S3.ObjectList;
  prefix?: string;
  bucket?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Get the bucket name from the query parameters
  const { bucket, prefix = '' } = req.query;
  
  if (!bucket || typeof bucket !== 'string') {
    return res.status(400).json({ error: 'Bucket name is required' });
  }

  try {
    // Use the reusable S3 client to list objects in the bucket
    const data = await listObjects(
      bucket,
      typeof prefix === 'string' ? prefix : ''
    );
    
    // Return the objects
    return res.status(200).json({
      objects: data.Contents,
      prefix: prefix as string,
      bucket
    });
  } catch (error: any) {
    console.error('Failed to list objects:', error);
    return res.status(500).json({ error: error.message });
  }
}
