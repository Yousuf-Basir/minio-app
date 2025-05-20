import Link from "next/link";
import { useEffect, useState } from "react";
import AWS from "aws-sdk";
import Layout from "../components/Layout";



type Bucket = AWS.S3.Bucket;

export default function Home() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch buckets when component mounts
    const fetchBuckets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/listBuckets');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setBuckets(data.buckets || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch buckets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch buckets');
      } finally {
        setLoading(false);
      }
    };

    fetchBuckets();
  }, []);

  return (
    <Layout title="MinIO File Browser" description="Browse your MinIO S3 buckets and files">
        <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">Your Buckets</h2>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-md w-full">
              <p>Error: {error}</p>
            </div>
          ) : buckets.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-md w-full">
              <p>No buckets found. Create a bucket to get started.</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buckets.map((bucket) => (
                    <Link key={bucket.Name} href={`/bucket/${bucket.Name}`}>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow h-full">
                        <div className="flex items-center space-x-3 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{bucket.Name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {bucket.CreationDate ? new Date(bucket.CreationDate).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
    </Layout>
  );
}
