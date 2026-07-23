import { 
  cloudinaryService, 
  getOptimizedImageUrl, 
  CloudinaryUploadOptions, 
  CloudinaryUploadResult 
} from "./cloudinaryService";

export interface CropOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zoom?: number;
  rotation?: number;
  outputWidth?: number;
  outputHeight?: number;
}

export class MediaService {
  /**
   * Upload an image file to Cloudinary
   */
  async uploadImage(file: File, options: CloudinaryUploadOptions = {}): Promise<CloudinaryUploadResult> {
    const mergedOptions: CloudinaryUploadOptions = {
      ...options,
      allowedTypes: options.allowedTypes || ["jpg", "jpeg", "png", "webp", "gif"],
      folder: options.folder || "sunshine-classes/students"
    };
    return cloudinaryService.uploadFile(file, mergedOptions);
  }

  /**
   * Upload a PDF file to Cloudinary
   */
  async uploadPDF(file: File, options: CloudinaryUploadOptions = {}): Promise<CloudinaryUploadResult> {
    const mergedOptions: CloudinaryUploadOptions = {
      ...options,
      allowedTypes: ["pdf"],
      folder: options.folder || "sunshine-classes/documents"
    };
    return cloudinaryService.uploadFile(file, mergedOptions);
  }

  /**
   * Capture a still image frame from an HTMLVideoElement and convert to File
   */
  captureImage(videoElement: HTMLVideoElement, fileName = "camera_capture.jpg", quality = 0.92): File {
    if (!videoElement) {
      throw new Error("Video element is required to capture image frame.");
    }
    const canvas = document.createElement("canvas");
    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not acquire 2D canvas context.");
    }

    // Mirror horizontally to match webcam live preview
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const parts = dataUrl.split(",");
    if (parts.length < 2 || !parts[1]) {
      throw new Error("Failed to encode canvas image to JPEG format.");
    }
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    return new File([blob], fileName, { type: "image/jpeg" });
  }

  /**
   * Crop an image element onto canvas with optional zoom, rotation, and offsets
   */
  async cropImage(
    imageElement: HTMLImageElement,
    fileName = "cropped_image.jpg",
    options: CropOptions = {}
  ): Promise<File> {
    if (!imageElement) {
      throw new Error("Image element is required to crop.");
    }

    const zoom = options.zoom || 1;
    const rotation = options.rotation || 0;
    const offsetX = options.x || 0;
    const offsetY = options.y || 0;
    const outWidth = options.outputWidth || 300;
    const outHeight = options.outputHeight || 300;

    const nw = imageElement.naturalWidth || imageElement.width || outWidth;
    const nh = imageElement.naturalHeight || imageElement.height || outHeight;

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not acquire 2D canvas context.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outWidth, outHeight);

    ctx.save();
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * (outWidth / 200), zoom * (outHeight / 200));
    ctx.translate(offsetX * (outWidth / 200), offsetY * (outHeight / 200));

    const fitRatio = Math.min(280 / nw, 280 / nh);
    const destW = nw * fitRatio;
    const destH = nh * fitRatio;

    ctx.drawImage(imageElement, -destW / 2, -destH / 2, destW, destH);
    ctx.restore();

    return new Promise((resolve, reject) => {
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const byteString = atob(dataUrl.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: "image/jpeg" });
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      } catch (err) {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], fileName, { type: "image/jpeg" }));
            } else {
              reject(new Error("Failed to render canvas blob during crop image operation."));
            }
          },
          "image/jpeg",
          0.95
        );
      }
    });
  }

  /**
   * Delete media asset from Cloudinary
   */
  async deleteMedia(publicId: string): Promise<boolean> {
    return cloudinaryService.deleteFile(publicId);
  }

  /**
   * Validate file format and size
   */
  validateFile(file: File, options: CloudinaryUploadOptions = {}): { isValid: boolean; error?: string } {
    return cloudinaryService.validateFile(file, options);
  }

  /**
   * Generate optimized thumbnail URL
   */
  generateThumbnail(url: string, type: "profile" | "thumbnail" | "gallery" = "thumbnail"): string {
    return getOptimizedImageUrl(url, type);
  }
}

export const mediaService = new MediaService();
