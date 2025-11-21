import { sanitizeFileName } from './validation';

type MagicSignature = {
  mimeType: string;
  bytes: number[];
  offset?: number;
  verifier?: (dataView: Uint8Array) => boolean;
};

const MAGIC_SIGNATURES: MagicSignature[] = [
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  {
    mimeType: 'image/webp',
    bytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    verifier: (data) =>
      data.length >= 12 &&
      data[8] === 0x57 &&
      data[9] === 0x45 &&
      data[10] === 0x42 &&
      data[11] === 0x50, // WEBP
  },
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4b, 0x03, 0x04], // ZIP container used by DOCX
  },
  { mimeType: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // Legacy DOC
];

function matchesSignature(data: Uint8Array, signature: MagicSignature): boolean {
  const offset = signature.offset ?? 0;
  if (data.length < signature.bytes.length + offset) return false;
  return signature.bytes.every((byte, index) => data[offset + index] === byte);
}

async function detectMimeTypeFromMagicBytes(file: File | Blob): Promise<string | null> {
  const probe = file.slice(0, 16);
  const buffer = await probe.arrayBuffer();
  const data = new Uint8Array(buffer);

  for (const signature of MAGIC_SIGNATURES) {
    if (matchesSignature(data, signature) && (!signature.verifier || signature.verifier(data))) {
      return signature.mimeType;
    }
  }

  return null;
}

export type UploadValidationOptions = {
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
  maxSizeBytes?: number;
};

export type UploadValidationResult = {
  detectedMimeType: string;
  sanitizedFileName: string;
  preparedFile: File;
};

function isMimeAllowed(
  allowedMimeTypes: string[],
  candidateMimeTypes: string[],
  extension: string | null
): boolean {
  const normalizedCandidates = candidateMimeTypes.filter(Boolean);
  if (normalizedCandidates.some((candidate) => allowedMimeTypes.includes(candidate))) {
    return true;
  }

  if (extension === 'docx' && allowedMimeTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    // Some browsers report generic zip mimetype for DOCX; allow based on extension as a fallback.
    return true;
  }

  return false;
}

export async function validateFileUpload(
  file: File,
  options: UploadValidationOptions
): Promise<UploadValidationResult> {
  const sanitizedFileName = sanitizeFileName(file.name);
  const extension = sanitizedFileName.split('.').pop()?.toLowerCase() ?? null;

  if (options.allowedExtensions && extension && !options.allowedExtensions.includes(extension)) {
    throw new Error('This file extension is not allowed.');
  }

  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    throw new Error('File size exceeds the allowed limit.');
  }

  const magicMime = await detectMimeTypeFromMagicBytes(file);
  const detectedMimeType = magicMime ?? file.type;

  if (!detectedMimeType) {
    throw new Error('We could not determine this file type.');
  }

  const contentTypeMatches = isMimeAllowed(options.allowedMimeTypes, [detectedMimeType, file.type], extension);

  if (!contentTypeMatches) {
    throw new Error('Unsupported file type.');
  }

  const preparedFile = new File([file], sanitizedFileName, { type: detectedMimeType });

  return { detectedMimeType, sanitizedFileName, preparedFile };
}

