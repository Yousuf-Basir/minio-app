import { S3Client } from '@aws-sdk/client-s3';
import { 
  ListBucketsCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import https from 'https';

interface S3Credentials {
  accessKey: string;
  secretKey: string;
  hostname: string;
  api: string;
  path: string;
  url?: string;
}

// Read the credentials file once at module load time
let credentials: S3Credentials;
try {
  const credentialsPath = path.resolve(process.cwd(), 'credentials.json');
  const credentialsRaw = fs.readFileSync(credentialsPath, 'utf8');
  credentials = JSON.parse(credentialsRaw);
  console.log('Loaded credentials for MinIO S3 client');
} catch (error) {
  console.error('Error loading credentials:', error);
  throw new Error('Failed to load S3 credentials');
}

/**
 * Creates and configures the S3 client for MinIO
 * @returns Configured S3Client instance
 */
const createS3Client = (): S3Client => {
  // Ensure the endpoint uses HTTPS protocol
  let endpoint = credentials.hostname;
  if (!endpoint.startsWith('https://')) {
    endpoint = 'https://' + endpoint.replace(/^http:\/\//, '');
  }
  
  // Create HTTPS agent that allows self-signed certificates
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });
  
  // Log the endpoint being used
  const maskedAccessKey = credentials.accessKey.substring(0, 4) + '***' + 
    credentials.accessKey.substring(credentials.accessKey.length - 4);
  console.log(`Configuring S3 client with endpoint: ${endpoint}, access key: ${maskedAccessKey}`);
  
  // Create and return the configured S3 client
  return new S3Client({
    region: 'us-east-1', // MinIO doesn't require a specific region
    endpoint,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey,
    },
    forcePathStyle: true, // Needed for MinIO
    requestHandler: new (require('@aws-sdk/node-http-handler').NodeHttpHandler)({
      httpsAgent
    })
  });
};

// Create a single S3 client instance to be used throughout the application
export const s3Client = createS3Client();

/**
 * Lists all buckets
 * @returns Promise resolving to list of buckets
 */
export const listBuckets = async () => {
  const command = new ListBucketsCommand({});
  const response = await s3Client.send(command);
  return response;
};

/**
 * Lists objects in a bucket with optional prefix
 * @param bucket - The bucket name
 * @param prefix - Optional prefix for filtering objects
 * @returns Promise resolving to list of objects
 */
export const listObjects = async (bucket: string, prefix: string = '') => {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    Delimiter: '/'
  });
  
  const response = await s3Client.send(command);
  return response;
};

/**
 * Gets a presigned URL for an object using AWS SDK v3
 * @param bucket - The bucket name
 * @param key - The object key
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Promise resolving to a presigned URL for the object
 */
export const getPresignedUrl = async (
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  // Generate the presigned URL
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Deletes a single object from a bucket
 * @param bucket - The bucket name
 * @param key - The object key to delete
 * @returns Promise resolving to the deletion result
 */
export const deleteObject = async (bucket: string, key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  try {
    const response = await s3Client.send(command);
    console.log(`Successfully deleted object: ${key} from bucket: ${bucket}`);
    return response;
  } catch (error) {
    console.error(`Error deleting object: ${key} from bucket: ${bucket}`, error);
    throw error;
  }
};

/**
 * Deletes multiple objects from a bucket in a single request
 * @param bucket - The bucket name
 * @param keys - Array of object keys to delete
 * @returns Promise resolving to the deletion result
 */
export const deleteObjects = async (bucket: string, keys: string[]) => {
  // S3 requires objects to be formatted as { Key: 'key' }
  const objects = keys.map(key => ({ Key: key }));
  
  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: objects,
      Quiet: false // Set to true to return only errors
    }
  });
  
  try {
    const response = await s3Client.send(command);
    console.log(`Successfully deleted ${keys.length} objects from bucket: ${bucket}`);
    return response;
  } catch (error) {
    console.error(`Error deleting objects from bucket: ${bucket}`, error);
    throw error;
  }
};
