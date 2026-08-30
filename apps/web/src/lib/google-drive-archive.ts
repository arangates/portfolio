import "server-only";

import { createHash } from "node:crypto";

import { auth, googleAuthEnabled } from "@portfolio/auth";
import { account, db, documentArchive, documentArchiveSetting } from "@portfolio/db";
import { and, count, desc, eq } from "drizzle-orm";

import { GOOGLE_DRIVE_FILE_SCOPE } from "./drive-archive-shared";

export { GOOGLE_DRIVE_FILE_SCOPE } from "./drive-archive-shared";

export type ArchiveSourceType =
  | "zerodha_holdings"
  | "zerodha_tradebook"
  | "degiro_transactions"
  | "degiro_account"
  | "salary_payslip"
  | "india_income_tax"
  | "netherlands_income_tax";

export type DriveArchiveResult = {
  status: "stored" | "already_stored" | "not_connected" | "disabled" | "failed";
  documentId?: string;
  message?: string;
};

type ArchiveFileInput = {
  userId: string;
  sourceType: ArchiveSourceType;
  sourceId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

type GoogleAccount = {
  accountId: string;
  hasRefreshToken: boolean;
  scopes: string[];
};

const ROOT_FOLDER_NAME = "Selvam";
const REQUEST_TIMEOUT_MS = 30_000;

const folderNames: Record<ArchiveSourceType, string> = {
  zerodha_holdings: "Zerodha holdings",
  zerodha_tradebook: "Zerodha tradebooks",
  degiro_transactions: "Degiro transactions",
  degiro_account: "Degiro account statements",
  salary_payslip: "Salary payslips",
  india_income_tax: "Indian income tax",
  netherlands_income_tax: "Dutch income tax",
};

function parseScopes(value: string | null) {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function safeFileName(value: string) {
  const leaf = value.replace(/^.*[\\/]/, "");
  const clean = [...leaf]
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("")
    .trim();
  return (clean || "Imported document").slice(0, 180);
}

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function publicError(error: unknown) {
  if (error instanceof DriveApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Google Drive permission needs to be renewed in Settings.";
    }
    if (error.status === 404) return "The Google Drive archive folder could not be found.";
    if (error.status === 429)
      return "Google Drive is temporarily rate limited. Re-upload to retry.";
  }
  return "The financial import succeeded, but its source file could not be archived to Google Drive.";
}

class DriveApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function googleAccountForUser(userId: string): Promise<GoogleAccount | null> {
  if (!googleAuthEnabled) return null;
  const [row] = await db
    .select({
      accountId: account.accountId,
      refreshToken: account.refreshToken,
      scope: account.scope,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);
  if (!row) return null;
  const scopes = parseScopes(row.scope);
  if (!scopes.includes(GOOGLE_DRIVE_FILE_SCOPE)) return null;
  return {
    accountId: row.accountId,
    hasRefreshToken: Boolean(row.refreshToken),
    scopes,
  };
}

async function accessTokenForUser(userId: string, googleAccount: GoogleAccount) {
  const tokens = await auth.api.getAccessToken({
    body: { providerId: "google", accountId: googleAccount.accountId, userId },
  });
  if (!tokens.accessToken) throw new Error("Google Drive access token is unavailable");
  return tokens.accessToken;
}

async function driveFetch(accessToken: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new DriveApiError(response.status, body.slice(0, 500));
  }
  return response;
}

async function findFolder(accessToken: string, role: string, parentId?: string) {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `appProperties has { key='selvamRole' and value='${role}' }`,
    parentId ? `'${parentId.replaceAll("'", "\\'")}' in parents` : null,
  ]
    .filter(Boolean)
    .join(" and ");
  const params = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,name,trashed)",
    pageSize: "1",
  });
  const response = await driveFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files?${params}`,
  );
  const payload = (await response.json()) as { files?: Array<{ id: string }> };
  return payload.files?.[0]?.id ?? null;
}

async function createFolder(accessToken: string, name: string, role: string, parentId?: string) {
  const response = await driveFetch(accessToken, "https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
      appProperties: { selvamRole: role },
    }),
  });
  const payload = (await response.json()) as { id?: string };
  if (!payload.id) throw new Error("Google Drive did not return a folder ID");
  return payload.id;
}

async function ensureSetting(userId: string) {
  const [setting] = await db
    .insert(documentArchiveSetting)
    .values({ userId, enabled: true })
    .onConflictDoNothing()
    .returning();
  if (setting) return setting;
  const [existing] = await db
    .select()
    .from(documentArchiveSetting)
    .where(eq(documentArchiveSetting.userId, userId))
    .limit(1);
  if (!existing) throw new Error("Could not initialize document archive settings");
  return existing;
}

async function ensureRootFolder(userId: string, accessToken: string) {
  const setting = await ensureSetting(userId);
  if (setting.rootFolderId) {
    try {
      const params = new URLSearchParams({ fields: "id,trashed" });
      const response = await driveFetch(
        accessToken,
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(setting.rootFolderId)}?${params}`,
      );
      const payload = (await response.json()) as { id?: string; trashed?: boolean };
      if (payload.id && !payload.trashed) return payload.id;
    } catch (error) {
      if (!(error instanceof DriveApiError) || error.status !== 404) throw error;
    }
  }

  const rootFolderId =
    (await findFolder(accessToken, "archive-root")) ??
    (await createFolder(accessToken, ROOT_FOLDER_NAME, "archive-root"));
  await db
    .update(documentArchiveSetting)
    .set({ rootFolderId, updatedAt: new Date() })
    .where(eq(documentArchiveSetting.userId, userId));
  return rootFolderId;
}

async function ensureSourceFolder(
  accessToken: string,
  rootFolderId: string,
  sourceType: ArchiveSourceType,
) {
  const role = `source-${sourceType}`;
  return (
    (await findFolder(accessToken, role, rootFolderId)) ??
    (await createFolder(accessToken, folderNames[sourceType], role, rootFolderId))
  );
}

async function uploadFile(
  accessToken: string,
  folderId: string,
  input: ArchiveFileInput,
  fileHash: string,
) {
  const metadata = {
    name: safeFileName(input.fileName),
    parents: [folderId],
    appProperties: {
      selvamRole: "source-document",
      selvamSourceType: input.sourceType,
      selvamSha256: fileHash,
    },
  };
  const start = await driveFetch(
    accessToken,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,sha256Checksum,parents",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": input.mimeType || "application/octet-stream",
        "X-Upload-Content-Length": String(input.bytes.byteLength),
      },
      body: JSON.stringify(metadata),
    },
  );
  const uploadUrl = start.headers.get("location");
  if (!uploadUrl) throw new Error("Google Drive did not create an upload session");
  const completed = await driveFetch(accessToken, uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.mimeType || "application/octet-stream",
      "Content-Length": String(input.bytes.byteLength),
    },
    body: Buffer.from(input.bytes),
  });
  const payload = (await completed.json()) as {
    id?: string;
    size?: string;
    sha256Checksum?: string;
  };
  if (!payload.id) throw new Error("Google Drive did not return a file ID");
  if (payload.size && Number(payload.size) !== input.bytes.byteLength) {
    throw new Error("Google Drive file size verification failed");
  }
  if (payload.sha256Checksum && payload.sha256Checksum !== fileHash) {
    throw new Error("Google Drive file checksum verification failed");
  }
  return payload.id;
}

async function saveArchiveRecord(
  input: ArchiveFileInput,
  values: {
    fileHash: string;
    status: "processing" | "stored" | "failed";
    providerFileId?: string | null;
    providerFolderId?: string | null;
    errorMessage?: string | null;
    uploadedAt?: Date | null;
  },
) {
  const [saved] = await db
    .insert(documentArchive)
    .values({
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      fileName: safeFileName(input.fileName),
      fileHash: values.fileHash,
      mimeType: input.mimeType || "application/octet-stream",
      fileSize: input.bytes.byteLength,
      providerFileId: values.providerFileId,
      providerFolderId: values.providerFolderId,
      status: values.status,
      errorMessage: values.errorMessage,
      uploadedAt: values.uploadedAt,
    })
    .onConflictDoUpdate({
      target: [documentArchive.userId, documentArchive.sourceType, documentArchive.sourceId],
      set: {
        fileName: safeFileName(input.fileName),
        fileHash: values.fileHash,
        mimeType: input.mimeType || "application/octet-stream",
        fileSize: input.bytes.byteLength,
        providerFileId: values.providerFileId,
        providerFolderId: values.providerFolderId,
        status: values.status,
        errorMessage: values.errorMessage,
        uploadedAt: values.uploadedAt,
        updatedAt: new Date(),
      },
    })
    .returning({ id: documentArchive.id });
  if (!saved) throw new Error("Could not save document archive metadata");
  return saved.id;
}

export async function archiveImportedFile(input: ArchiveFileInput): Promise<DriveArchiveResult> {
  const googleAccount = await googleAccountForUser(input.userId);
  if (!googleAccount) return { status: "not_connected" };
  const setting = await ensureSetting(input.userId);
  if (!setting.enabled) return { status: "disabled" };

  const fileHash = hash(input.bytes);
  const [existingSource] = await db
    .select({ id: documentArchive.id, status: documentArchive.status })
    .from(documentArchive)
    .where(
      and(
        eq(documentArchive.userId, input.userId),
        eq(documentArchive.sourceType, input.sourceType),
        eq(documentArchive.sourceId, input.sourceId),
      ),
    )
    .limit(1);
  if (existingSource?.status === "stored") {
    return { status: "already_stored", documentId: existingSource.id };
  }

  const [matchingFile] = await db
    .select({
      providerFileId: documentArchive.providerFileId,
      providerFolderId: documentArchive.providerFolderId,
    })
    .from(documentArchive)
    .where(
      and(
        eq(documentArchive.userId, input.userId),
        eq(documentArchive.fileHash, fileHash),
        eq(documentArchive.status, "stored"),
      ),
    )
    .limit(1);
  if (matchingFile?.providerFileId) {
    const documentId = await saveArchiveRecord(input, {
      fileHash,
      status: "stored",
      providerFileId: matchingFile.providerFileId,
      providerFolderId: matchingFile.providerFolderId,
      uploadedAt: new Date(),
      errorMessage: null,
    });
    return { status: "already_stored", documentId };
  }

  await saveArchiveRecord(input, { fileHash, status: "processing", errorMessage: null });
  try {
    const accessToken = await accessTokenForUser(input.userId, googleAccount);
    const rootFolderId = await ensureRootFolder(input.userId, accessToken);
    const folderId = await ensureSourceFolder(accessToken, rootFolderId, input.sourceType);
    const providerFileId = await uploadFile(accessToken, folderId, input, fileHash);
    const uploadedAt = new Date();
    const documentId = await saveArchiveRecord(input, {
      fileHash,
      status: "stored",
      providerFileId,
      providerFolderId: folderId,
      uploadedAt,
      errorMessage: null,
    });
    return { status: "stored", documentId };
  } catch (error) {
    const message = publicError(error);
    const documentId = await saveArchiveRecord(input, {
      fileHash,
      status: "failed",
      errorMessage: message,
    });
    return { status: "failed", documentId, message };
  }
}

export async function initializeDriveArchive(userId: string) {
  const googleAccount = await googleAccountForUser(userId);
  if (!googleAccount) throw new Error("Connect Google Drive before creating the archive folder.");
  const accessToken = await accessTokenForUser(userId, googleAccount);
  const rootFolderId = await ensureRootFolder(userId, accessToken);
  return { rootFolderId };
}

export async function setDriveArchiveEnabled(userId: string, enabled: boolean) {
  await db
    .insert(documentArchiveSetting)
    .values({ userId, enabled })
    .onConflictDoUpdate({
      target: documentArchiveSetting.userId,
      set: { enabled, updatedAt: new Date() },
    });
}

export async function getDriveArchiveState(userId: string) {
  const [googleAccount, setting, documents, statusCounts] = await Promise.all([
    googleAccountForUser(userId),
    db
      .select({
        enabled: documentArchiveSetting.enabled,
        rootFolderId: documentArchiveSetting.rootFolderId,
      })
      .from(documentArchiveSetting)
      .where(eq(documentArchiveSetting.userId, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        id: documentArchive.id,
        sourceType: documentArchive.sourceType,
        fileName: documentArchive.fileName,
        fileSize: documentArchive.fileSize,
        status: documentArchive.status,
        errorMessage: documentArchive.errorMessage,
        uploadedAt: documentArchive.uploadedAt,
        createdAt: documentArchive.createdAt,
      })
      .from(documentArchive)
      .where(eq(documentArchive.userId, userId))
      .orderBy(desc(documentArchive.createdAt))
      .limit(100),
    db
      .select({ status: documentArchive.status, count: count() })
      .from(documentArchive)
      .where(eq(documentArchive.userId, userId))
      .groupBy(documentArchive.status),
  ]);
  const counts = Object.fromEntries(statusCounts.map((row) => [row.status, row.count]));
  return {
    available: googleAuthEnabled,
    connected: Boolean(googleAccount),
    refreshReady: googleAccount?.hasRefreshToken ?? false,
    enabled: setting?.enabled ?? true,
    rootFolderReady: Boolean(setting?.rootFolderId),
    documentCount: statusCounts.reduce((total, row) => total + row.count, 0),
    storedCount: counts.stored ?? 0,
    failedCount: counts.failed ?? 0,
    documents,
  };
}

export async function getDriveDocument(userId: string, documentId: string) {
  const [document] = await db
    .select({
      id: documentArchive.id,
      fileName: documentArchive.fileName,
      mimeType: documentArchive.mimeType,
      fileSize: documentArchive.fileSize,
      providerFileId: documentArchive.providerFileId,
      status: documentArchive.status,
    })
    .from(documentArchive)
    .where(and(eq(documentArchive.id, documentId), eq(documentArchive.userId, userId)))
    .limit(1);
  return document ?? null;
}

export async function getDriveDocumentAccess(userId: string, documentId: string) {
  const document = await getDriveDocument(userId, documentId);
  if (!document || document.status !== "stored" || !document.providerFileId) return null;
  const googleAccount = await googleAccountForUser(userId);
  if (!googleAccount) throw new Error("Google Drive is not connected.");
  const accessToken = await accessTokenForUser(userId, googleAccount);
  return { document, accessToken };
}

export async function fetchDriveDocumentContent(userId: string, documentId: string) {
  const access = await getDriveDocumentAccess(userId, documentId);
  if (!access) return null;
  const response = await driveFetch(
    access.accessToken,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(access.document.providerFileId!)}?alt=media`,
  );
  return { document: access.document, response };
}

export async function getDriveRootFolderUrl(userId: string) {
  const [setting] = await db
    .select({ rootFolderId: documentArchiveSetting.rootFolderId })
    .from(documentArchiveSetting)
    .where(eq(documentArchiveSetting.userId, userId))
    .limit(1);
  if (!setting?.rootFolderId) return null;
  return `https://drive.google.com/drive/folders/${encodeURIComponent(setting.rootFolderId)}`;
}
