import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import AWS from "aws-sdk";
import Layout from "../../components/Layout";
import UploadModal from "../../components/UploadModal";
import { toast } from "react-hot-toast";



type S3Object = AWS.S3.Object;

export default function BucketPage() {
  const router = useRouter();
  const { name: bucketName, prefix = "" } = router.query;
  
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState<string>("");
  const [commonPrefixes, setCommonPrefixes] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null);

  const fetchObjects = async () => {
    if (!bucketName) return;
    
    try {
      setLoading(true);
      const queryPrefix = typeof prefix === "string" ? prefix : "";
      
      const response = await fetch(
        `/api/listObjects?bucket=${encodeURIComponent(bucketName as string)}&prefix=${encodeURIComponent(queryPrefix)}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setObjects(data.objects || []);
      setCurrentPrefix(queryPrefix);
      
      // Extract common prefixes (folders) from object keys
      if (data.objects && Array.isArray(data.objects)) {
        const prefixes = new Set<string>();
        
        data.objects.forEach((obj: S3Object) => {
          if (obj.Key && obj.Key !== queryPrefix) {
            // Check if this is a "folder" (has additional path components)
            const relativePath = obj.Key.slice(queryPrefix.length);
            const nextPathComponent = relativePath.split('/')[0];
            
            if (nextPathComponent && relativePath.includes('/')) {
              prefixes.add(`${queryPrefix}${nextPathComponent}/`);
            }
          }
        });
        
        setCommonPrefixes(Array.from(prefixes));
      }
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch objects:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch objects");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (bucketName) {
      fetchObjects();
    }
  }, [bucketName, prefix]);
  
  // Function to delete a file
  const deleteFile = async (key: string) => {
    if (!bucketName || !key) return;
    
    try {
      setIsDeleting(true);
      setDeleteTarget(key);
      
      const response = await fetch(
        `/api/deleteFile?bucket=${encodeURIComponent(bucketName as string)}&key=${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('File deleted successfully');
        // Refresh the file list
        fetchObjects();
      } else {
        toast.error(`Error: ${data.message || 'Failed to delete file'}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };
  
  // Function to download a file
  const downloadFile = async (key: string, fileName: string) => {
    if (!bucketName || !key) return;
    
    try {
      setIsDownloading(true);
      setDownloadTarget(key);
      
      toast.loading(`Preparing ${fileName} for download...`, { id: `download-${key}` });
      
      // Create a download link
      const downloadUrl = `/api/downloadFile?bucket=${encodeURIComponent(bucketName as string)}&key=${encodeURIComponent(key)}`;
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${fileName}`, { id: `download-${key}` });
    } catch (error) {
      console.error('Error initiating download:', error);
      toast.error(`Failed to download ${fileName}. Please try again.`, { id: `download-${key}` });
    } finally {
      setIsDownloading(false);
      setDownloadTarget(null);
    }
  };

  // Function to format file size
  const formatBytes = (bytes: number | undefined) => {
    if (!bytes) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to get parent prefix
  const getParentPrefix = (prefix: string) => {
    if (!prefix) return "";
    
    const parts = prefix.split('/');
    // Remove the last part and the empty string after the last slash
    parts.splice(-2, 2);
    
    return parts.join('/') + (parts.length > 0 ? '/' : '');
  };

  // Function to get file extension
  const getFileExtension = (filename: string) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  };

  // Function to determine if an object is a folder
  const isFolder = (key: string | undefined) => {
    if (!key) return false;
    return key.endsWith('/');
  };

  // Function to get file icon based on extension
  const getFileIcon = (key: string | undefined) => {
    if (!key) return "/file.svg";
    
    if (isFolder(key)) return "/folder.svg";
    
    const ext = getFileExtension(key).toLowerCase();
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return "/image.svg";
      case 'pdf':
        return "/document.svg";
      case 'doc':
      case 'docx':
      case 'txt':
      case 'md':
        return "/document.svg";
      case 'xls':
      case 'xlsx':
      case 'csv':
        return "/table.svg";
      case 'mp3':
      case 'wav':
      case 'ogg':
        return "/audio.svg";
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return "/video.svg";
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return "/archive.svg";
      default:
        return "/file.svg";
    }
  };

  return (
    <Layout bucketName={bucketName} description="Browse files in your MinIO S3 bucket">
        <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              {bucketName}
            </h2>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload File
            </button>
          </div>

          {/* Path and navigation controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            {/* Breadcrumb navigation */}
            <div className="flex items-center gap-1 overflow-x-auto py-2 w-full bg-gray-50 dark:bg-gray-800 px-3 rounded-md text-sm">
              <Link href={`/bucket/${bucketName}`} className="text-blue-600 hover:text-blue-800 whitespace-nowrap flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {bucketName}
              </Link>
              
              {currentPrefix && currentPrefix.split('/').filter(Boolean).map((part, index, array) => {
                const prefixUpToHere = array.slice(0, index + 1).join('/') + '/';
                return (
                  <div key={prefixUpToHere} className="flex items-center">
                    <span className="mx-1 text-gray-500">/</span>
                    <Link 
                      href={`/bucket/${bucketName}?prefix=${encodeURIComponent(prefixUpToHere)}`}
                      className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                    >
                      {part}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Parent directory button */}
            {currentPrefix && (
              <Link
                href={`/bucket/${bucketName}?prefix=${encodeURIComponent(getParentPrefix(currentPrefix))}`}
                className="flex items-center gap-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Up to parent
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-md w-full">
              <p>Error: {error}</p>
            </div>
          ) : objects.length === 0 && commonPrefixes.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-md w-full">
              <p>This bucket is empty.</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-1 gap-3">
                {/* Folders first */}
                {commonPrefixes.map((prefix) => {
                  const folderName = prefix.split('/').filter(Boolean).pop() || prefix;
                  return (
                    <Link 
                      key={prefix}
                      href={`/bucket/${bucketName}?prefix=${encodeURIComponent(prefix)}`}
                      className="block"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <div className="flex-grow">
                          <p className="font-medium text-blue-700 dark:text-blue-300 truncate">{folderName}/</p>
                        </div>
                        <div className="hidden sm:flex items-center text-xs text-blue-600/70 dark:text-blue-400/70 gap-2">
                          <span>Folder</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                
                {/* Files */}
                {objects
                  .filter(obj => obj.Key && obj.Key !== currentPrefix && !commonPrefixes.some(prefix => obj.Key?.startsWith(prefix)))
                  .map((object) => {
                    // Skip if this is a directory marker
                    if (object.Key?.endsWith('/')) return null;
                    
                    // Get the file name without the prefix
                    const fileName = object.Key?.slice(currentPrefix.length) || 'Unknown';
                    
                    return (
                      <div key={object.Key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-grow min-w-0"> {/* min-width: 0 helps with text truncation */}
                            <p className="font-medium text-gray-900 dark:text-white truncate">{fileName}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatBytes(object.Size)}</span>
                              <span className="truncate">{object.LastModified ? new Date(object.LastModified).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Download button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (object.Key) {
                                  downloadFile(object.Key, fileName);
                                }
                              }}
                              disabled={isDownloading && downloadTarget === object.Key}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                              title="Download file"
                            >
                              {isDownloading && downloadTarget === object.Key ? (
                                <div className="h-5 w-5 border-t-2 border-r-2 border-blue-600 rounded-full animate-spin"></div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (object.Key && window.confirm(`Are you sure you want to delete ${fileName}?`)) {
                                  deleteFile(object.Key);
                                }
                              }}
                              disabled={isDeleting && deleteTarget === object.Key}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                              title="Delete file"
                            >
                              {isDeleting && deleteTarget === object.Key ? (
                                <div className="h-5 w-5 border-t-2 border-r-2 border-red-600 rounded-full animate-spin"></div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        
        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          bucketName={bucketName as string}
          prefix={currentPrefix}
          onUploadComplete={(file) => {
            // Refresh the file list after upload
            fetchObjects();
          }}
        />
    </Layout>
  );
}
