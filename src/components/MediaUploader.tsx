import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  X, 
  FileText, 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Maximize2 
} from "lucide-react";
import { cloudinaryService, getPublicIdFromUrl, getOptimizedImageUrl } from "../services/cloudinaryService";

export interface MediaUploaderProps {
  id: string;
  value?: string;
  onChange?: (url: string) => void;
  folder?: "students" | "teachers" | "documents" | "study-material" | "assignments" | "results" | "notices" | "gallery" | "settings" | "homework";
  maxSizeMB?: number;
  allowedTypes?: string[]; // e.g. ["jpg", "jpeg", "png", "webp", "pdf"]
  label?: string;
  multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  id,
  value = "",
  onChange,
  folder = "documents",
  maxSizeMB = 10,
  allowedTypes = ["jpg", "jpeg", "png", "webp", "pdf"],
  label,
  multiple = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [fullScreenPreviewUrl, setFullScreenPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fileUrls = value
    ? value.split(",").map(url => url.trim()).filter(Boolean)
    : [];

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
      processAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUpload(file);
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const processAndUpload = async (file: File) => {
    setError(null);
    setCurrentFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isPdf = ext === "pdf";
    const actualMaxMB = isPdf ? 20 : maxSizeMB;
    const maxSizeBytes = actualMaxMB * 1024 * 1024;

    const validation = cloudinaryService.validateFile(file, {
      allowedTypes,
      maxSize: maxSizeBytes,
    });

    if (!validation.isValid) {
      setError(validation.error || "File size or type check failed.");
      return;
    }

    setUploadProgress(0);
    const folderName = cloudinaryService.getFolderByContext(folder as any) || folder;

    try {
      const result = await cloudinaryService.uploadFile(file, {
        folder: folderName,
        allowedTypes,
        maxSize: maxSizeBytes,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      if (multiple) {
        const updated = [...fileUrls, result.secure_url];
        if (onChange) onChange(updated.join(","));
      } else {
        if (onChange) onChange(result.secure_url);
      }
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setError(err.message || "Upload operation failed. Please retry.");
      setUploadProgress(null);
    }
  };

  const handleDelete = async (idx: number) => {
    const urlToDelete = fileUrls[idx];
    if (!urlToDelete) return;

    const publicId = getPublicIdFromUrl(urlToDelete);
    if (publicId) {
      setUploadProgress(0);
      try {
        await cloudinaryService.deleteFile(publicId);
      } catch (err) {
        console.error("Cloudinary secure deletion failed:", err);
      } finally {
        setUploadProgress(null);
      }
    }

    if (multiple) {
      const updated = fileUrls.filter((_, i) => i !== idx);
      if (onChange) onChange(updated.join(","));
    } else {
      if (onChange) onChange("");
    }
    setError(null);
  };

  return (
    <div className="space-y-3.5 text-left">
      {label && (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Grid of uploaded assets */}
      {fileUrls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {fileUrls.map((url, idx) => {
            const ext = url.split(".").pop()?.toLowerCase() || "";
            const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
            const isPdf = ext === "pdf";

            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-150 bg-slate-50/70 shadow-3xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImage ? (
                    <img
                      src={getOptimizedImageUrl(url, "thumbnail")}
                      alt={`Attached item ${idx + 1}`}
                      className="h-10 w-10 object-cover rounded-xl border border-slate-200 bg-white shadow-3xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`p-2.5 rounded-xl shrink-0 ${isPdf ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <span className="block text-xs font-bold text-slate-700 truncate max-w-[140px]" title={url}>
                      {url.split("/").pop() || `Attachment_${idx + 1}.${ext}`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                      {isImage ? "Image Media" : isPdf ? "PDF Document" : `${ext.toUpperCase()} File`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id={`${id}-preview-btn-${idx}`}
                    type="button"
                    onClick={() => {
                      if (isImage) {
                        setFullScreenPreviewUrl(url);
                      } else {
                        window.open(url, "_blank");
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                    title={isImage ? "View Fullscreen" : "Open in New Tab"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    id={`${id}-delete-btn-${idx}`}
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                    title="Remove File"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Box Zone */}
      {(!value || multiple || uploadProgress !== null) && (
        <div
          id={`media-uploader-box-${id}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
            isDragOver
              ? "border-emerald-600 bg-emerald-50/20 scale-[0.99] shadow-xs"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/15"
          }`}
        >
          {/* File input loaders */}
          <input
            id={id}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={allowedTypes.map((t) => `.${t}`).join(",")}
            className="hidden"
          />
          <input
            id={`${id}-camera`}
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {uploadProgress !== null ? (
              <motion.div
                key="uploading-progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4 flex flex-col items-center justify-center"
              >
                <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-700">
                  Uploading {currentFileName || "File"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Secure upload progress: {uploadProgress}%
                </p>
                <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-200/50">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-150" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="flex gap-2.5 mb-3">
                  <button
                    id={`${id}-browse-trigger`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all cursor-pointer shadow-3xs"
                    title="Browse Files"
                  >
                    <Upload className="h-4.5 w-4.5" />
                  </button>
                  <button
                    id={`${id}-camera-trigger`}
                    type="button"
                    onClick={triggerCamera}
                    className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all cursor-pointer shadow-3xs"
                    title="Capture with Mobile Camera"
                  >
                    <Camera className="h-4.5 w-4.5" />
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Drag & drop, browse, or snap with your camera
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports: {allowedTypes.join(", ").toUpperCase()} (Max {maxSizeMB}MB)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error Message banner */}
      {error && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fullscreen Image Preview overlay */}
      <AnimatePresence>
        {fullScreenPreviewUrl && (
          <div 
            className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
            onClick={() => setFullScreenPreviewUrl(null)}
          >
            <button
              id="btn-close-fullscreen-preview"
              type="button"
              onClick={() => setFullScreenPreviewUrl(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer shadow-md transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              src={fullScreenPreviewUrl}
              alt="Fullscreen Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
