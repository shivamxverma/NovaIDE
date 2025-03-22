import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

// Initialize Google Cloud Storage client
const storage = new Storage({
  keyFilename: process.env.GCP_KEY_FILE, // Path to your service account key file
  projectId: process.env.GCP_PROJECT_ID, // Your GCP project ID
});

const bucketName = process.env.GCS_BUCKET ?? ""; // Your GCS bucket name

export const fetchGCSFolder = async (prefix: string, localPath: string): Promise<void> => {
  try {
    const options = {
      prefix, // Similar to S3's Prefix, filters objects by prefix
    };

    // List all files in the specified prefix
    const [files] = await storage.bucket(bucketName).getFiles(options);

    // Use Promise.all to download files in parallel
    await Promise.all(
      files.map(async (file) => {
        const fileKey = file.name;
        const filePath = `${localPath}/${fileKey.replace(prefix, "")}`;

        // Download the file content
        const [fileData] = await file.download();

        // Write the file locally
        await writeFile(filePath, fileData);

        console.log(`Downloaded ${fileKey} to ${filePath}`);
      })
    );
  } catch (error) {
    console.error("Error fetching folder:", error);
  }
};

export async function copyGCSFolder(
  sourcePrefix: string,
  destinationPrefix: string,
  pageToken?: string
): Promise<void> {
  try {
    // List all objects in the source prefix
    const options = {
      prefix: sourcePrefix,
      pageToken, // For pagination, similar to S3's ContinuationToken
    };

    const [files, , apiResponse] = await storage.bucket(bucketName).getFiles(options);

    if (!files || files.length === 0) return;

    // Copy each file to the new location
    await Promise.all(
      files.map(async (file) => {
        const sourceKey = file.name;
        const destinationKey = sourceKey.replace(sourcePrefix, destinationPrefix);
        const destinationFile = storage.bucket(bucketName).file(destinationKey);

        // Copy the file within the same bucket
        await file.copy(destinationFile);

        console.log(`Copied ${sourceKey} to ${destinationKey}`);
      })
    );

    // Check if there are more files to process (pagination)
    if (apiResponse.nextPageToken) {
      await copyGCSFolder(sourcePrefix, destinationPrefix, apiResponse.nextPageToken);
    }
  } catch (error) {
    console.error("Error copying folder:", error);
  }
};

// Helper function to write file locally (same as original)
function writeFile(filePath: string, fileData: Buffer): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await createFolder(path.dirname(filePath));

    fs.writeFile(filePath, fileData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Helper function to create folder (same as original)
function createFolder(dirName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirName, { recursive: true }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export const saveToGCS = async (key: string, filePath: string, content: string): Promise<void> => {
  try {
    const file = storage.bucket(bucketName).file(`${key}${filePath}`);

    // Upload the content to GCS
    await file.save(content, {
      contentType: "text/plain", // Adjust content type as needed
    });

    console.log(`Saved content to ${key}${filePath}`);
  } catch (error) {
    console.error("Error saving to GCS:", error);
  }
};