import { auth } from "../lib/firebase";

/**
 * Cloudinary Secure Upload and Resource Management Service
 * Supports signed uploads, delivery optimization, and secure server-side deletion.
 */

export interface CloudinaryUploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  onProgress?: (progress: number) => void;
  onCancel?: () => void;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  asset_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  folder: string;
}

/**
 * Extracts the public_id of an asset from its Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  
  const uploadIdx = url.indexOf("/upload/");
  if (uploadIdx === -1) return null;
  
  let path = url.substring(uploadIdx + 8);
  
  // Strip version number if present (e.g. "v1720612345/")
  if (path.match(/^v\d+\//)) {
    const firstSlashIdx = path.indexOf("/");
    path = path.substring(firstSlashIdx + 1);
  }
  
  // Strip file extension
  const lastDotIdx = path.lastIndexOf(".");
  if (lastDotIdx !== -1) {
    path = path.substring(0, lastDotIdx);
  }
  
  return path;
}

/**
 * Automatically applies format and quality optimizations, and face-based profile thumbnailing.
 */
export function getOptimizedImageUrl(url: string, type?: "profile" | "thumbnail" | "gallery"): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  
  const extension = url.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);
  if (!isImage) return url;

  if (type === "profile") {
    // Generate an optimized square profile photo thumbnail cropping around the detected face
    return url.replace("/upload/", "/upload/c_thumb,g_face,w_200,h_200,f_auto,q_auto/");
  }
  if (type === "thumbnail") {
    return url.replace("/upload/", "/upload/c_fit,w_400,f_auto,q_auto/");
  }
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

class CloudinaryService {
  /**
   * Validates file format and size
   */
  validateFile(file: File, options: CloudinaryUploadOptions = {}): { isValid: boolean; error?: string } {
    if (!file) {
      return {
        isValid: false,
        error: "Invalid file object. No file selected for upload.",
      };
    }

    if (!file.name || typeof file.name !== "string") {
      return {
        isValid: false,
        error: "Invalid file name. Upload aborted.",
      };
    }

    const allowedExtensions = options.allowedTypes || ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx"];
    const maxBytes = options.maxSize || 10 * 1024 * 1024; // Default 10MB limit

    // Validate size
    if (file.size > maxBytes) {
      return {
        isValid: false,
        error: `File size exceeds the limit of ${Math.round(maxBytes / (1024 * 1024))}MB.`,
      };
    }

    // Validate extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed formats: ${allowedExtensions.join(", ")}`,
      };
    }

    // Malware/Harmful block
    const fileType = file.type || "";
    if (fileType && (fileType.includes("javascript") || fileType.includes("html") || fileType.includes("executable") || fileType.includes("x-msdownload"))) {
      return {
        isValid: false,
        error: "Executable or potentially harmful scripts are strictly blocked.",
      };
    }

    return { isValid: true };
  }

  /**
   * Standardizes Firestore/Cloudinary storage folder based on context
   */
  getFolderByContext(context: "students" | "teachers" | "documents" | "study-material" | "assignments" | "results" | "notices" | "gallery" | "settings"): string {
    const folderMapping: Record<string, string> = {
      students: "students",
      teachers: "teachers",
      documents: "documents",
      "study-material": "study-material",
      assignments: "homework",
      results: "results",
      notices: "notices",
      gallery: "gallery",
      settings: "admins",
    };
    return folderMapping[context] || "documents";
  }

  /**
   * Asynchronously uploads file using secure signed uploads
   */
  async uploadFile(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const validation = this.validateFile(file, options);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const requestedFolder = options.folder || "documents";
    
    // 1. Fetch upload signature from backend
    const signatureResponse = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: requestedFolder,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        userId: auth.currentUser?.uid || "anonymous_user",
        role: localStorage.getItem("sunshine_remember_role") || "STUDENT"
      })
    });

    if (!signatureResponse.ok) {
      const errRes = await signatureResponse.json();
      throw new Error(errRes.error || `Failed to fetch upload signature. Status: ${signatureResponse.status}`);
    }

    const { signature, timestamp, apiKey, cloudName, folder, isMock } = await signatureResponse.json();

    // 2. If backend signals sandbox mock/fallback mode, simulate upload and return formatted metadata
    if (isMock) {
      console.warn("Cloudinary not configured on server. Simulating signed upload...");
      
      for (let i = 1; i <= 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (options.onProgress) options.onProgress(i * 10);
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      const isPdf = ext === "pdf";

      let secureUrl = `https://res.cloudinary.com/sunshine-classes/image/upload/v1720612345/${folder}/${Date.now()}_${file.name}`;
      if (isPdf) {
        secureUrl = `https://res.cloudinary.com/sunshine-classes/image/upload/v1720612345/${folder}/${Date.now()}_document.pdf`;
      } else if (!isImg) {
        secureUrl = `https://res.cloudinary.com/sunshine-classes/raw/upload/v1720612345/${folder}/${Date.now()}_data.${ext}`;
      }

      return {
        secure_url: secureUrl,
        public_id: `${folder}/${Date.now()}`,
        asset_id: `mock-asset-${Date.now()}`,
        resource_type: isImg ? "image" : "raw",
        format: ext,
        bytes: file.size,
        created_at: new Date().toISOString(),
        folder: folder
      };
    }

    // 3. For live production signed upload, construct FormData & POST to Cloudinary API
    const fileTypeStr = file?.type || "";
    const resourceType = fileTypeStr.startsWith("image/") ? "image" : "raw";
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);

      if (options.onCancel) {
        options.onCancel();
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              secure_url: response.secure_url,
              public_id: response.public_id,
              asset_id: response.asset_id || `asset-${Date.now()}`,
              resource_type: response.resource_type,
              format: response.format || file.name.split(".").pop()?.toLowerCase() || "",
              bytes: response.bytes,
              width: response.width,
              height: response.height,
              created_at: response.created_at || new Date().toISOString(),
              folder: response.folder || folder
            });
          } catch (e) {
            reject(new Error("Failed to parse Cloudinary response."));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || "Cloudinary secure signed upload failed."));
          } catch {
            reject(new Error(`Upload failed with status code ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network communication error occurred during upload."));
      };

      xhr.send(formData);
    });
  }

  /**
   * Securely destroys an asset on Cloudinary via the Express backend
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/delete-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          userId: auth.currentUser?.uid || "anonymous_user",
          role: localStorage.getItem("sunshine_remember_role") || "STUDENT"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete from Cloudinary");
      }

      const resData = await response.json();
      return resData.success;
    } catch (err) {
      console.error("Cloudinary secure deletion failed:", err);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
