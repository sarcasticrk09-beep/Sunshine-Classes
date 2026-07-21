/**
 * Cloudinary Storage Integration Service
 * Manages secure file uploads, validation, compression/optimization, and direct unsigned upload.
 */

import { cloudinaryService, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../services/cloudinaryService';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  format: string;
  optimizedUrl: string;
  thumbnailUrl: string;
}

/**
 * Validates a file before uploading to verify file size and allowed MIME types.
 */
export function validateUploadedFile(
  file: File,
  allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  return cloudinaryService.validateFile(file, {
    allowedTypes: allowedExtensions,
    maxSize: maxSizeMB * 1024 * 1024
  });
}

/**
 * Uploads a file to Cloudinary using Unsigned Preset 'sunshine_classes' and Cloud Name 'gtn424dm'.
 */
export function uploadFileToCloudinary(params: {
  file: File;
  folder: 'students' | 'teachers' | 'staff' | 'documents' | 'receipts' | 'assignments' | 'study-material' | 'results' | 'notices' | 'gallery' | 'settings' | 'homework';
  cloudName?: string;
  uploadPreset?: string;
  onProgress?: (percent: number) => void;
  onSuccess?: (result: CloudinaryUploadResult) => void;
  onError?: (error: string) => void;
  cancelTokenRef?: { cancel?: () => void };
}): void {
  const { file, folder, onProgress, onSuccess, onError } = params;

  // 1. Run validation
  const validation = validateUploadedFile(file);
  if (!validation.isValid) {
    if (onError) onError(validation.error || 'Validation error');
    return;
  }

  const folderPath = cloudinaryService.getFolderByContext(folder);

  cloudinaryService.uploadFile(file, {
    folder: folderPath,
    onProgress: (p) => {
      if (onProgress) onProgress(p);
    }
  }).then((res) => {
    const isImage = res.resource_type === 'image' || ['jpg', 'jpeg', 'png', 'webp'].includes(res.format);
    const result: CloudinaryUploadResult = {
      url: res.secure_url,
      publicId: res.public_id,
      originalName: file.name,
      size: res.bytes,
      format: res.format,
      optimizedUrl: res.secure_url,
      thumbnailUrl: isImage ? res.secure_url.replace('/upload/', '/upload/c_fit,w_300,f_auto,q_auto/') : res.secure_url
    };
    if (onSuccess) onSuccess(result);
  }).catch((err) => {
    if (onError) onError(err.message || 'Upload failed');
  });
}

/**
 * Deletes an uploaded asset from Cloudinary via backend proxy using API Secret.
 */
export async function deleteFileFromCloudinary(params: {
  publicId: string;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}): Promise<{ success: boolean; log: string }> {
  const { publicId } = params;

  if (publicId.startsWith('sunshine') && publicId.includes('/sim_')) {
    return { success: true, log: `Simulated deletion completed successfully for publicId ${publicId}` };
  }

  try {
    const success = await cloudinaryService.deleteFile(publicId);
    return {
      success,
      log: success ? 'Asset deleted successfully' : 'Asset deletion returned failure status'
    };
  } catch (error: any) {
    console.error('[CloudinaryService] Deletion request failed:', error);
    return { success: false, log: `Deletion Failed: ${error.message}` };
  }
}

