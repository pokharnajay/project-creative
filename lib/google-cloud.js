import { Storage } from '@google-cloud/storage';

let storageClient = null;

export function getStorageClient() {
  if (storageClient) return storageClient;

  const projectId = process.env.GCS_PROJECT_ID;
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Cloud Storage credentials');
  }

  storageClient = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });

  return storageClient;
}

export async function uploadToGCS(file, fileName, contentType) {
  try {
    const storage = getStorageClient();
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME is not defined');
    }

    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: contentType,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        reject(err);
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.end(file);
    });
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

export async function deleteFromGCS(fileName) {
  try {
    const storage = getStorageClient();
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME is not defined');
    }

    const bucket = storage.bucket(bucketName);
    await bucket.file(fileName).delete();

    return true;
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    throw error;
  }
}
