import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  bucketName: string;
  prefix?: string;
  onUploadComplete?: (file: any) => void;
  onUploadError?: (error: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  bucketName, 
  prefix = '', 
  onUploadComplete,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const file = acceptedFiles[0]; // Handle one file at a time
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      const queryParams = new URLSearchParams({
        bucket: bucketName,
        ...(prefix && { prefix })
      }).toString();
      
      const response = await fetch(`/api/uploadFile?${queryParams}`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      setUploadProgress(100);
      const data = await response.json();
      
      if (onUploadComplete) {
        onUploadComplete(data.file);
      }
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);
      
    } catch (error: unknown) {
      console.error('Upload error:', error);
      setUploading(false);
      setUploadProgress(0);
      
      if (onUploadError) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        onUploadError(errorMessage);
      }
    }
  }, [bucketName, prefix, onUploadComplete, onUploadError]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: uploading,
    multiple: false,
  });
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
          isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
          'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="py-4">
            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading... {Math.round(uploadProgress)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48" 
              aria-hidden="true"
            >
              <path 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload a file to {bucketName}{prefix ? `/${prefix}` : ''}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
