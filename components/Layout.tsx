import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  bucketName?: string | string[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'MinIO File Browser', 
  description = 'Browse your MinIO S3 buckets and files',
  bucketName
}) => {
  const pageTitle = bucketName ? `${bucketName} - ${title}` : title;
  
  return (
    <div className={`${geistSans.className} ${geistMono.className} flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]`}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header bucketName={bucketName} />
      
      <main className="flex-grow flex flex-col items-center p-4 sm:p-8 w-full">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
