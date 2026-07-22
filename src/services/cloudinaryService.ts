// Cloudinary Service

export const CLOUDINARY_CLOUD_NAME = "gtn424dm";
export const CLOUDINARY_UPLOAD_PRESET = "sunshine_classes";

function getCurrentUserId(): string {
  try {
    const userStr = localStorage.getItem("sunshine_user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u && u.id) return u.id;
    }
  } catch (e) {
    // ignore
  }
  return "anonymous_user";
}

/**
 * Cloudinary Unsigned Upload and Resource Management Service
 * Uses Cloud Name 'gtn424dm' and Unsigned Upload Preset 'sunshine_classes'.
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
   * Validates file format and size before upload
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

    const allowedExtensions = options.allowedTypes || ["jpg", "jpeg", "png", "webp", "pdf"];
    const maxBytes = options.maxSize || 10 * 1024 * 1024; // Strict 10MB limit

    // Validate size
    if (file.size > maxBytes) {
      return {
        isValid: false,
        error: `File size exceeds the maximum permitted limit of 10 MB (File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      };
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    // Explicit malware/harmful extension block
    const blockedExtensions = ["exe", "zip", "apk", "js", "html", "php", "bat", "sh", "vbs", "cmd", "scr", "msi"];
    if (extension && blockedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Security violation: .${extension} files are strictly prohibited from being uploaded.`,
      };
    }

    // Validate extension against allowed list
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file type .${extension || "unknown"}. Allowed formats: ${allowedExtensions.map(e => e.toUpperCase()).join(", ")}.`,
      };
    }

    // Check MIME type for dangerous script types
    const fileType = file.type || "";
    if (fileType && (fileType.includes("javascript") || fileType.includes("html") || fileType.includes("executable") || fileType.includes("x-msdownload"))) {
      return {
        isValid: false,
        error: "Executable scripts or HTML/JS files are strictly blocked.",
      };
    }

    return { isValid: true };
  }

  /**
   * Standardizes Cloudinary storage subfolders based on entity context
   */
  getFolderByContext(context: "students" | "teachers" | "staff" | "documents" | "receipts" | "assignments" | "study-material" | "results" | "notices" | "gallery" | "settings" | "homework"): string {
    const folderMapping: Record<string, string> = {
      students: "sunshine-classes/students",
      teachers: "sunshine-classes/teachers",
      staff: "sunshine-classes/staff",
      documents: "sunshine-classes/documents",
      receipts: "sunshine-classes/receipts",
      assignments: "sunshine-classes/assignments",
      homework: "sunshine-classes/assignments",
      "study-material": "sunshine-classes/documents",
      results: "sunshine-classes/documents",
      notices: "sunshine-classes/documents",
      gallery: "sunshine-classes/documents",
      settings: "sunshine-classes/staff",
    };
    return folderMapping[context] || "sunshine-classes/documents";
  }

  /**
   * Directly uploads file to Cloudinary via Unsigned Preset 'sunshine_classes' and Cloud Name 'gtn424dm'
   */
  async uploadFile(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const validation = this.validateFile(file, options);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const cloudName = CLOUDINARY_CLOUD_NAME;
    const uploadPreset = CLOUDINARY_UPLOAD_PRESET;
    const targetFolder = options.folder 
      ? (options.folder.startsWith("sunshine-classes/") ? options.folder : `sunshine-classes/${options.folder}`)
      : "sunshine-classes/documents";

    const fileTypeStr = file?.type || "";
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = fileTypeStr.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
    const resourceType = isImage ? "image" : "raw";
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", targetFolder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);

      if (options.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && options.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              secure_url: response.secure_url,
              public_id: response.public_id,
              asset_id: response.asset_id || `asset-${Date.now()}`,
              resource_type: response.resource_type || (isImage ? "image" : "raw"),
              format: response.format || ext,
              bytes: response.bytes || file.size,
              width: response.width,
              height: response.height,
              created_at: response.created_at || new Date().toISOString(),
              folder: response.folder || targetFolder
            });
          } catch (e) {
            reject(new Error("Failed to parse Cloudinary upload response."));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || `Cloudinary upload failed with status ${xhr.status}.`));
          } catch {
            reject(new Error(`Cloudinary upload failed with HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network connection error occurred during file upload."));
      };

      xhr.send(formData);
    });
  }

  /**
   * Securely destroys an asset on Cloudinary via the Express backend using API Secret
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/delete-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          userId: getCurrentUserId(),
          role: localStorage.getItem("sunshine_remember_role") || "STUDENT"
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete asset from Cloudinary.");
      }

      const resData = await response.json();
      return resData.success;
    } catch (err) {
      console.error("Cloudinary secure asset deletion error:", err);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();

