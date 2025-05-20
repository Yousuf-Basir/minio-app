import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import { s3Client } from '../../utils/awsS3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket, prefix = '' } = req.query;

    if (!bucket || typeof bucket !== 'string') {
      return res.status(400).json({ error: 'Bucket name is required' });
    }

    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
    });

    const formData: { fields: Fields; files: Files } = await new Promise((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = formData.files.file?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = fs.readFileSync(file.filepath);
    const fileName = file.originalFilename || 'unnamed-file';
    
    // Construct the key with prefix if provided
    const key = prefix ? `${prefix}${fileName}` : fileName;

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype || 'application/octet-stream',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Clean up the temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({ 
      success: true, 
      message: 'File uploaded successfully',
      file: {
        name: fileName,
        key: key,
        size: file.size,
        type: file.mimetype
      }
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to upload file', details: errorMessage });
  }
}
