# MinIO App

MinIO App is a Next.js application that provides a web interface for interacting with MinIO S3-compatible storage. It allows users to list, upload, download, and delete files in their MinIO buckets.

## Features

- List all buckets
- List all objects in a bucket
- Upload files to a bucket
- Download files from a bucket
- Delete files from a bucket

## Installation

### Install Minio using docker

Docker Compose file:

```bash

version: '3'
services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    restart: unless-stopped

volumes:
  minio_data:

```

Run docker compose:

```bash
docker compose up -d
```

Your minio server should be running at http://localhost:9000 and the console at http://localhost:9001

Create a Access Key and a Secret Key in the MinIO console. If you are downloading the credentials.json file from MinIO, make sure to add the hostname to the ```hostname``` field. The hostname should be the URL of your MinIO server (e.g. http://localhost:9000).


### Intsall and run MinIO App

Clone the repository and update the ```credentials.json``` file with your MinIO credentials.

```bash
npm install
```

## Usage

```bash
npm run dev
```

## License

MIT
