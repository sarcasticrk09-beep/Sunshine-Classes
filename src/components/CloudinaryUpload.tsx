import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  X, 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  File, 
  Eye,
  Crop,
  RotateCw,
  Plus,
  Camera
} from "lucide-react";
import { cloudinaryService, getPublicIdFromUrl, getOptimizedImageUrl } from "../services/cloudinaryService";

interface CloudinaryUploadProps {
  id: string;
  // Backward compatibility with first interface:
  context?: "students" | "teachers" | "documents" | "study-material" | "assignments" | "results" | "notices" | "gallery" | "settings";
  value?: string;
  onChange?: (url: string) => void;
  
  // Backward compatibility with second interface:
  folder?: "students" | "teachers" | "documents" | "study-material" | "assignments" | "results" | "notices" | "gallery" | "settings" | "homework";
  cloudName?: string;
  uploadPreset?: string;
  apiKey?: string;
  apiSecret?: string;
  maxSizeMB?: number;
  initialUrl?: string;
  onUploadSuccess?: (url: string) => void;
  onFileDeleted?: () => void;
  allowedTypes?: string[]; // e.g. ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx"]
  label?: string;
  multiple?: boolean;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  id,
  context,
  value,
  onChange,
  folder,
  maxSizeMB = 10,
  initialUrl,
  onUploadSuccess,
  onFileDeleted,
  allowedTypes = ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx"],
  label,
  multiple
}) => {
  // Normalize inputs: support both signature styles seamlessly
  const resolvedFolder = folder || context || "documents";
  const resolvedValue = value !== undefined ? value : (initialUrl !== undefined ? initialUrl : "");
  
  const resolvedOnChange = (newUrl: string) => {
    if (onChange) onChange(newUrl);
    if (onUploadSuccess) onUploadSuccess(newUrl);
    if (newUrl === "" && onFileDeleted) onFileDeleted();
  };

  const isMultipleMode = multiple || resolvedFolder === "assignments" || resolvedFolder === "homework";

  // Split value into multiple files if multiple mode
  const fileUrls = isMultipleMode 
    ? resolvedValue.split(",").map(url => url.trim()).filter(Boolean)
    : resolvedValue ? [resolvedValue] : [];

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  // Cropping Tool States
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Camera Capture States & Refs
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setShowCameraModal(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Failed to access camera:", err);
      let errorMsg = "Could not access camera. Please check your browser permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera access denied. Please grant camera permissions in your browser settings and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera device found on this system.";
      }
      setCameraError(errorMsg);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    try {
      if (!videoRef.current) return;

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Mirror the captured frame to match the user's view
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        if (dataUrl && dataUrl.startsWith("data:image/")) {
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const capturedFile = new File([blob], `camera_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          preProcessFile(capturedFile);
          return;
        }
      } catch (err) {
        console.warn("Synchronous webcam dataURL capture failed, falling back to toBlob", err);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `camera_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          preProcessFile(capturedFile);
        } else {
          console.error("Canvas toBlob returned null.");
          setError("Failed to process captured photo. Please try uploading a file instead.");
        }
      }, "image/jpeg", 0.95);
    } catch (err: any) {
      console.error("Failed to capture photo from webcam:", err);
      setError("Webcam capture failed: " + (err.message || "Unknown error"));
    }
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (cropImageSrc && cropImageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [cropImageSrc]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      preProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      preProcessFile(file);
    }
  };

  const preProcessFile = (file: File) => {
    setError(null);
    setCurrentFile(file);

    // Validate size and format
    const isPdf = file.name.split(".").pop()?.toLowerCase() === "pdf";
    const actualMaxMB = isPdf ? 20 : maxSizeMB; // PDFs allowed up to 20MB, others up to maxSizeMB (default 10MB)
    const maxSizeBytes = actualMaxMB * 1024 * 1024;

    const validation = cloudinaryService.validateFile(file, {
      allowedTypes,
      maxSize: maxSizeBytes,
    });

    if (!validation.isValid) {
      setError(validation.error || "Invalid file size or format.");
      return;
    }

    // Circular crop is ONLY for Student or Teacher profile photos
    const isProfileContext = resolvedFolder === "students" || resolvedFolder === "teachers";
    const isImage = file.type.startsWith("image/");

    if (isProfileContext && isImage) {
      const imageUrl = URL.createObjectURL(file);
      setCropImageSrc(imageUrl);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setShowCropModal(true);
    } else {
      uploadProcessedFile(file);
    }
  };

  const uploadProcessedFile = async (file: File) => {
    setUploadProgress(0);
    const isPdf = file.name.split(".").pop()?.toLowerCase() === "pdf";
    const actualMaxMB = isPdf ? 20 : maxSizeMB;
    const maxSizeBytes = actualMaxMB * 1024 * 1024;
    const folderName = cloudinaryService.getFolderByContext(resolvedFolder as any) || resolvedFolder;

    try {
      const result = await cloudinaryService.uploadFile(file, {
        folder: folderName,
        allowedTypes,
        maxSize: maxSizeBytes,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (isMultipleMode) {
        const updatedUrls = [...fileUrls, result.secure_url];
        resolvedOnChange(updatedUrls.join(","));
      } else {
        resolvedOnChange(result.secure_url);
      }
      setUploadProgress(null);
      setCurrentFile(null);
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setError(err.message || "Failed to upload file. Please try again.");
      setUploadProgress(null);
    }
  };

  const handleCancel = () => {
    setUploadProgress(null);
    setError("Upload cancelled by user.");
    setCurrentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (indexToDelete: number) => {
    const urlToDelete = fileUrls[indexToDelete];
    if (urlToDelete) {
      const publicId = getPublicIdFromUrl(urlToDelete);
      if (publicId) {
        setUploadProgress(0);
        try {
          await cloudinaryService.deleteFile(publicId);
        } catch (err) {
          console.error("Secure asset deletion failed:", err);
        } finally {
          setUploadProgress(null);
        }
      }
    }

    if (isMultipleMode) {
      const updatedUrls = fileUrls.filter((_, idx) => idx !== indexToDelete);
      resolvedOnChange(updatedUrls.join(","));
    } else {
      resolvedOnChange("");
    }

    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Crop Canvas Math
  const handleCropSave = async () => {
    if (!cropImageRef.current || !currentFile) return;

    try {
      const img = cropImageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculations based on 200x200px crop circle container
      const cropBoxSize = 200;
      const containerSize = 280;
      
      // Original image physical vs display scale
      const displayWidth = img.clientWidth || img.width || containerSize;
      const displayHeight = img.clientHeight || img.height || containerSize;
      
      // Scale factor
      const scaleX = (img.naturalWidth && displayWidth) ? (img.naturalWidth / displayWidth) : 1;
      const scaleY = (img.naturalHeight && displayHeight) ? (img.naturalHeight / displayHeight) : 1;

      // Middle coordinate of crop circle relative to display image top-left
      const centerX = containerSize / 2;
      const centerY = containerSize / 2;

      // Display coordinates of cropping region center (adjusted for dragging offsets)
      const cropDisplayX = centerX - offset.x;
      const cropDisplayY = centerY - offset.y;

      // Crop box width/height in display size
      const displayCropW = cropBoxSize / zoom;
      const displayCropH = cropBoxSize / zoom;

      // Map back to natural image coordinates
      const sourceX = (cropDisplayX - displayCropW / 2) * scaleX;
      const sourceY = (cropDisplayY - displayCropH / 2) * scaleY;
      const sourceW = displayCropW * scaleX;
      const sourceH = displayCropH * scaleY;

      // Render onto canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);

      // Apply rotation if any
      if (rotation !== 0) {
        ctx.translate(150, 150);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-150, -150);
      }

      const nw = img.naturalWidth || img.width || 300;
      const nh = img.naturalHeight || img.height || 300;

      let dx = isFinite(sourceX) ? Math.max(0, sourceX) : 0;
      let dy = isFinite(sourceY) ? Math.max(0, sourceY) : 0;
      let dw = isFinite(sourceW) ? Math.min(nw, sourceW) : nw;
      let dh = isFinite(sourceH) ? Math.min(nh, sourceH) : nh;

      // Force clamp to natural bounds to prevent out of bounds IndexSizeError/InvalidStateError in browser
      if (dx >= nw) dx = 0;
      if (dy >= nh) dy = 0;
      if (dx + dw > nw) {
        dw = nw - dx;
      }
      if (dy + dh > nh) {
        dh = nh - dy;
      }

      // Final sanitization of dimensions
      if (dw <= 0 || isNaN(dw)) dw = nw;
      if (dh <= 0 || isNaN(dh)) dh = nh;
      if (dw <= 0) dw = 1;
      if (dh <= 0) dh = 1;

      ctx.drawImage(
        img,
        dx,
        dy,
        dw,
        dh,
        0,
        0,
        300,
        300
      );

      // Attempt high-stability synchronous conversion first to bypass any iframe sandboxing limitations on toBlob
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        if (dataUrl && dataUrl.startsWith("data:image/")) {
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const croppedFile = new File([blob], `cropped_${currentFile.name}`, {
            type: "image/jpeg",
          });
          setShowCropModal(false);
          uploadProcessedFile(croppedFile);
          return;
        }
      } catch (err) {
        console.warn("Synchronous crop canvas dataURL conversion failed, falling back to toBlob", err);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], `cropped_${currentFile.name}`, {
            type: "image/jpeg",
          });
          setShowCropModal(false);
          uploadProcessedFile(croppedFile);
        } else {
          // Fallback to original
          console.warn("Canvas toBlob returned null for cropped image, uploading original.");
          setShowCropModal(false);
          uploadProcessedFile(currentFile);
        }
      }, "image/jpeg", 0.95);
    } catch (err: any) {
      console.error("Failed to crop image:", err);
      // Fallback: upload original file
      setShowCropModal(false);
      uploadProcessedFile(currentFile);
    }
  };

  // Drag listeners inside Crop Modal
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile cropping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  return (
    <div className="space-y-2 text-left">
      {label && (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Grid of uploaded files in multiple mode */}
      {fileUrls.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2 mb-2">
          {fileUrls.map((url, idx) => {
            const ext = url.split(".").pop()?.toLowerCase() || "";
            const isImageFile = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
            const isPdfFile = ext === "pdf";

            return (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 bg-slate-50/75 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 justify-between shadow-3xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isImageFile ? (
                    <img
                      src={getOptimizedImageUrl(url, "thumbnail")}
                      alt={`Preview ${idx + 1}`}
                      className="h-9 w-9 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`p-2 rounded-lg shrink-0 ${isPdfFile ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <span className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]" title={url}>
                      {url.split("/").pop() || `File_${idx + 1}.${ext}`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                      {isImageFile ? "Image Asset" : isPdfFile ? "PDF Document" : `${ext} File`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    id={`${id}-preview-btn-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="View Full Size"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <button
                    id={`${id}-delete-btn-${idx}`}
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Remove Attachment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone */}
      {(!resolvedValue || isMultipleMode || uploadProgress !== null) && (
        <div
          id={`cloudinary-upload-container-${id}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 bg-slate-50/20 dark:bg-slate-950/10 ${
            isDragOver
              ? "border-emerald-600 bg-emerald-50/10 scale-[0.99]"
              : "border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800"
          }`}
        >
          <input
            id={id}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={allowedTypes.map((t) => `.${t}`).join(",")}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {uploadProgress !== null ? (
              /* Uploading State */
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-3 flex flex-col items-center justify-center"
              >
                <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mb-2" />
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Uploading {currentFile?.name || "file"} ({uploadProgress}%)
                </p>
                <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-150" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <button
                  id={`${id}-cancel-upload`}
                  type="button"
                  onClick={handleCancel}
                  className="text-[9.5px] font-bold text-red-500 hover:underline mt-1.5"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              /* Empty state / Trigger Upload */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-2.5 flex flex-col items-center justify-center"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-1.5">
                  {isMultipleMode && fileUrls.length > 0 ? <Plus className="h-4.5 w-4.5" /> : <Upload className="h-4 w-4" />}
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isMultipleMode && fileUrls.length > 0 
                    ? "Click or drag to attach another sheet/file"
                    : "Drag and drop your file here, or browse"
                  }
                </p>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  Supports: {allowedTypes.join(", ").toUpperCase()} (Max {resolvedFolder === "assignments" ? "20MB PDF, 10MB Images" : `${maxSizeMB}MB`})
                </p>
                {allowedTypes.some(t => ["jpg", "jpeg", "png", "webp"].includes(t.toLowerCase())) && (
                  <button
                    id={`${id}-camera-capture-trigger-btn`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Capture via Camera
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Crop Modal Overlay */}
      <AnimatePresence>
        {showCropModal && cropImageSrc && (
          <div className="fixed inset-0 bg-slate-900/85 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Crop className="h-4 w-4 text-emerald-600" /> Adjust Profile Photo
                </h4>
                <button
                  id="btn-close-crop-modal"
                  type="button"
                  onClick={() => {
                    setShowCropModal(false);
                    setCurrentFile(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Viewport for cropping */}
              <div className="flex flex-col items-center">
                <div
                  ref={cropContainerRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="relative h-[280px] w-[280px] bg-slate-100 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-200/60"
                  style={{ touchAction: "none" }}
                >
                  {/* The Image */}
                  <img
                    ref={cropImageRef}
                    src={cropImageSrc}
                    alt="Source to Crop"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className="absolute max-w-none origin-center pointer-events-auto select-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      top: 0,
                      left: 0,
                    }}
                    referrerPolicy="no-referrer"
                  />

                  {/* Circle Mask Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 flex items-center justify-center">
                    <div className="h-[200px] w-[200px] rounded-full border border-white shadow-[0_0_0_999px_rgba(0,0,0,0.4)]" />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                  Drag photo to position. Use sliders to scale/rotate.
                </p>

                {/* Controls */}
                <div className="w-full mt-4 space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Zoom Level</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      id="crop-zoom-slider"
                      type="range"
                      min="1"
                      max="3.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Rotate Angle</span>
                      <span>{rotation}°</span>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <input
                        id="crop-rotate-slider"
                        type="range"
                        min="0"
                        max="360"
                        step="10"
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <button
                        id="btn-crop-rotate-step"
                        type="button"
                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="grid grid-cols-2 gap-3.5 w-full mt-5 pt-3 border-t border-slate-100">
                  <button
                    id="btn-crop-skip"
                    type="button"
                    onClick={() => {
                      setShowCropModal(false);
                      if (currentFile) uploadProcessedFile(currentFile);
                    }}
                    className="py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                  >
                    Skip & Upload Original
                  </button>
                  <button
                    id="btn-crop-apply"
                    type="button"
                    onClick={handleCropSave}
                    className="py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow-md cursor-pointer"
                  >
                    Apply Crop & Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Modal Overlay */}
      <AnimatePresence>
        {showCameraModal && (
          <div className="fixed inset-0 bg-slate-900/85 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-600 animate-pulse" /> Capture Student Photo
                </h4>
                <button
                  id="btn-close-camera-modal"
                  type="button"
                  onClick={stopCamera}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Viewfinder Area */}
              <div className="flex flex-col items-center">
                <div className="relative h-[280px] w-[280px] bg-black rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-2 z-10">
                      <RefreshCw className="h-7 w-7 text-emerald-500 animate-spin" />
                      <p className="text-[11px] font-semibold text-slate-300">Initializing camera...</p>
                    </div>
                  )}

                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center gap-3">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <p className="text-xs font-medium text-slate-300">{cameraError}</p>
                      <button
                        id="btn-retry-camera"
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Video Stream */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                        style={{ transform: "scaleX(-1)" }} // Mirror effect for standard webcam comfort
                      />

                      {/* Photo Target Guide Ring */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="h-[210px] w-[210px] rounded-full border-2 border-dashed border-emerald-500/80 bg-emerald-500/5 shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
                          {/* Corner Focus Hooks */}
                          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        Live Feed
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 font-semibold mt-2.5 text-center">
                  Align face inside the green dashed target, then capture.
                </p>

                {/* Shutter Trigger Button */}
                <div className="flex gap-3 w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 justify-center">
                  <button
                    id="btn-camera-cancel"
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-camera-shutter"
                    type="button"
                    disabled={!!cameraError || cameraLoading || !cameraStream}
                    onClick={capturePhoto}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Alert with Close button */}
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 mt-1 bg-red-50 px-2.5 py-2 rounded-xl border border-red-100/40">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
