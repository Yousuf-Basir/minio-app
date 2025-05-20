import type { NextApiRequest, NextApiResponse } from 'next';
import { s3Client } from '../../utils/awsS3Client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Create the GetObjectCommand
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // Get the object from MinIO
    const response = await s3Client.send(command);
    
    // Extract the file content and metadata
    const stream = response.Body as Readable;
    const contentType = response.ContentType || 'application/octet-stream';
    const contentLength = response.ContentLength;
    const fileName = key.split('/').pop() || key;

    // Set the appropriate headers for the download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream the file to the response
    stream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    
    // If the response headers have already been sent, we can't send a JSON error
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to download file', 
        error: error.message 
      });
    }
  }
}
