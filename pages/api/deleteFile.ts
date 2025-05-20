import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteObject } from '../../utils/awsS3Client';

type Data = {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get the bucket and key from the query parameters
    const { bucket, key } = req.query;
    
    if (!bucket || typeof bucket !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Bucket name is required' 
      });
    }

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'File key is required' 
      });
    }

    // Delete the file from the bucket
    await deleteObject(bucket, key);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: `File ${key} deleted successfully from bucket ${bucket}` 
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete file', 
      error: error.message 
    });
  }
}
