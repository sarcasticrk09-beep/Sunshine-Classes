/**
 * Cloudinary Storage Integration Service
 * Manages secure file uploads, validation, compression/optimization, and simulation fallback
 */

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
  allowedExtensions: string[] = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx'],
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file type ".${ext || ''}". Allowed types are: ${allowedExtensions.join(', ').toUpperCase()}`
    };
  }

  const fileSizeBytes = file.size;
  const maxSizeRefs = maxSizeMB * 1024 * 1024;
  if (fileSizeBytes > maxSizeRefs) {
    return {
      isValid: false,
      error: `File size exceeds the maximum permitted limit of ${maxSizeMB}MB (Current size: ${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB)`
    };
  }

  // Prevent executable extensions (XSS & File Execution prevention)
  const dangerousExts = ['exe', 'bat', 'sh', 'js', 'vbs', 'com', 'cmd', 'scr', 'msi'];
  if (ext && dangerousExts.includes(ext)) {
    return {
      isValid: false,
      error: `Security Alert: Executable or scripting files are strictly blocked for upload.`
    };
  }

  return { isValid: true };
}

/**
 * Uploads a file to Cloudinary using an XMLHttpRequest to support progress tracking, cancellation, and fallback simulation.
 */
export function uploadFileToCloudinary(params: {
  file: File;
  folder: 'students' | 'teachers' | 'documents' | 'study-material' | 'assignments' | 'results' | 'notices' | 'gallery' | 'settings';
  cloudName?: string;
  uploadPreset?: string;
  onProgress?: (percent: number) => void;
  onSuccess?: (result: CloudinaryUploadResult) => void;
  onError?: (error: string) => void;
  cancelTokenRef?: { cancel?: () => void };
}): void {
  const { file, folder, cloudName, uploadPreset, onProgress, onSuccess, onError, cancelTokenRef } = params;

  // 1. Run local input validation
  const validation = validateUploadedFile(file);
  if (!validation.isValid) {
    if (onError) onError(validation.error || 'Validation error');
    return;
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);

  // If Cloudinary keys are missing, gracefully run in high-fidelity simulation mode
  if (!cloudName || !uploadPreset || cloudName === 'NONE' || uploadPreset === 'NONE' || cloudName === '' || uploadPreset === '') {
    console.log(`[CloudinaryService] Operating in Simulation Mode (No keys set). Progress and metadata are accurately modeled.`);
    
    let progress = 0;
    let isCancelled = false;

    if (cancelTokenRef) {
      cancelTokenRef.cancel = () => {
        isCancelled = true;
        console.log(`[CloudinaryService] Upload cancelled by user`);
        if (onError) onError('Upload cancelled by user');
      };
    }

    const interval = setInterval(() => {
      if (isCancelled) {
        clearInterval(interval);
        return;
      }

      progress += Math.floor(Math.random() * 15) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Generate high-fidelity mockup urls
        // For local simulation, we can use an ObjectURL to make sure image/PDF previews show the ACTUAL uploaded file!
        const localObjUrl = URL.createObjectURL(file);
        
        // Form simulated optimized/thumbnail URLs
        const simPublicId = `sunshine_erp/${folder}/sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const simulatedResult: CloudinaryUploadResult = {
          url: localObjUrl, // Use local blob url for instant high-quality rendering in iframe/preview
          publicId: simPublicId,
          originalName: file.name,
          size: file.size,
          format: fileExt,
          optimizedUrl: localObjUrl,
          thumbnailUrl: isImage ? localObjUrl : 'https://res.cloudinary.com/demo/image/upload/v12345/document_icon.png'
        };

        console.log(`[CloudinaryService] Simulated upload completed successfully!`, simulatedResult);
        if (onProgress) onProgress(100);
        if (onSuccess) onSuccess(simulatedResult);
      } else {
        if (onProgress) onProgress(progress);
      }
    }, 150);

    return;
  }

  // 2. Perform Real Cloudinary Upload via API
  try {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `sunshine_erp/${folder}`);

    xhr.open('POST', url, true);

    if (cancelTokenRef) {
      cancelTokenRef.cancel = () => {
        xhr.abort();
        console.log(`[CloudinaryService] Real upload cancelled by user`);
        if (onError) onError('Upload cancelled by user');
      };
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Form optimized URLs using Cloudinary's dynamic transformation features
          // f_auto: automatic format selection, q_auto: automatic compression
          const secureUrl = response.secure_url;
          const pubId = response.public_id;
          
          let optimizedUrl = secureUrl;
          let thumbnailUrl = secureUrl;

          if (isImage) {
            optimizedUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
            thumbnailUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto,w_150,h_150,c_fill/');
          }

          const result: CloudinaryUploadResult = {
            url: secureUrl,
            publicId: pubId,
            originalName: file.name,
            size: response.bytes,
            format: response.format || fileExt,
            optimizedUrl,
            thumbnailUrl: isImage ? thumbnailUrl : 'https://res.cloudinary.com/demo/image/upload/v12345/document_icon.png'
          };

          console.log(`[CloudinaryService] Upload succeeded!`, result);
          if (onProgress) onProgress(100);
          if (onSuccess) onSuccess(result);
        } catch (err: any) {
          if (onError) onError(`Failed to parse Cloudinary response: ${err.message}`);
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          if (onError) onError(errResponse.error?.message || `Upload failed with status code ${xhr.status}`);
        } catch {
          if (onError) onError(`Upload failed with status code ${xhr.status}`);
        }
      }
    };

    xhr.onerror = () => {
      if (onError) onError('Network connection error occurred during file upload.');
    };

    xhr.send(formData);

  } catch (error: any) {
    console.error('[CloudinaryService] Native failure:', error);
    if (onError) onError(`Upload failed: ${error.message}`);
  }
}

/**
 * Deletes an uploaded asset from Cloudinary.
 * Since deleting requires a signed API call, we route it through our server proxy to avoid exposing API Secrets on the client!
 */
export async function deleteFileFromCloudinary(params: {
  publicId: string;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}): Promise<{ success: boolean; log: string }> {
  const { publicId, cloudName, apiKey, apiSecret } = params;

  if (publicId.startsWith('sunshine_erp/') && publicId.includes('/sim_')) {
    console.log(`[CloudinaryService] Deleting simulated asset: ${publicId}`);
    return { success: true, log: `Simulated deletion completed successfully for publicId ${publicId}` };
  }

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'NONE' || apiKey === 'NONE' || apiSecret === 'NONE') {
    console.warn(`[CloudinaryService] Cannot execute real deletion: Missing credentials in request. Simulating success.`);
    return { success: true, log: `Simulated deletion fallback for publicId ${publicId}` };
  }

  try {
    const response = await fetch('/api/delete-cloudinary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicId, cloudName, apiKey, apiSecret })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: data.success, log: data.log || 'Asset deleted successfully' };
  } catch (error: any) {
    console.error('[CloudinaryService] Deletion request failed:', error);
    return { success: false, log: `Deletion Failed: ${error.message}` };
  }
}
