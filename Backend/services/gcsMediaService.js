const path = require("path");
const { Storage } = require("@google-cloud/storage");

const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "";
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "";
const GCS_KEY_FILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(process.cwd(), "srh-hof.json");

let storageClient = null;

function gcsEnabled() {
  return Boolean(GCS_BUCKET_NAME);
}

function getStorage() {
  if (!storageClient) {
    storageClient = new Storage({
      projectId: GCS_PROJECT_ID || undefined,
      keyFilename: GCS_KEY_FILE,
    });
  }
  return storageClient;
}

function getBucket() {
  return getStorage().bucket(GCS_BUCKET_NAME);
}

function toGcsUri(objectName) {
  return `gs://${GCS_BUCKET_NAME}/${objectName}`;
}

function parseGcsUri(uri) {
  if (!uri || typeof uri !== "string" || !uri.startsWith("gs://")) return null;
  const withoutScheme = uri.slice("gs://".length);
  const firstSlash = withoutScheme.indexOf("/");
  if (firstSlash === -1) return null;
  const bucketName = withoutScheme.slice(0, firstSlash);
  const objectName = withoutScheme.slice(firstSlash + 1);
  if (!bucketName || !objectName) return null;
  return { bucketName, objectName };
}

async function uploadFileToGcs(localFilePath, objectName, contentType) {
  if (!gcsEnabled()) return null;

  const bucket = getBucket();
  await bucket.upload(localFilePath, {
    destination: objectName,
    metadata: contentType ? { contentType } : undefined,
  });
  return toGcsUri(objectName);
}

async function getSignedReadUrl(uri, expiresMs = 1000 * 60 * 60 * 6) {
  const parsed = parseGcsUri(uri);
  if (!parsed) return uri;

  try {
    const file = getStorage().bucket(parsed.bucketName).file(parsed.objectName);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiresMs,
      version: "v4",
    });
    return url;
  } catch (_err) {
    return uri;
  }
}

async function materializeProjectMedia(projectDoc) {
  if (!projectDoc) return projectDoc;

  const project = projectDoc.toObject ? projectDoc.toObject() : { ...projectDoc };
  const images = Array.isArray(project.images) ? project.images : [];
  project.images = await Promise.all(images.map((img) => getSignedReadUrl(img)));
  if (project.demoVideo) {
    project.demoVideo = await getSignedReadUrl(project.demoVideo);
  }
  const resourceFiles = Array.isArray(project.resourceFiles) ? project.resourceFiles : [];
  project.resourceFiles = await Promise.all(
    resourceFiles.map((fileUri) => getSignedReadUrl(fileUri))
  );
  return project;
}

module.exports = {
  gcsEnabled,
  uploadFileToGcs,
  materializeProjectMedia,
};
