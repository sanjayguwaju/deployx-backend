import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "auto";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn("S3 Configuration is missing in environment variables. File uploads to S3 will fail.");
}

export const s3Client = new S3Client({
  region: region,
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: false, 
});
