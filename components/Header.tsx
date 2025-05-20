import Link from 'next/link';
import React from 'react';

interface HeaderProps {
  bucketName?: string | string[];
}

const Header: React.FC<HeaderProps> = ({ bucketName }) => {
  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
            <path d="M2 13h10" />
            <path d="M5 1v22" />
          </svg>
          <a href="/" className="text-xl font-bold">
            <h1 className="text-xl font-bold">MinIO/S3 File Browser</h1>
          </a>
        </div>
        {bucketName ? (
          <Link href="/" className="text-sm text-white hover:text-blue-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            All Buckets
          </Link>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
