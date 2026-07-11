import React, { useState, useRef } from "react";
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
  Eye 
} from "lucide-react";
import { cloudinaryService, getPublicIdFromUrl, getOptimizedImageUrl } from "../services/cloudinaryService";

interface CloudinaryUploadProps {
  id: string;
  context: "students" | "teachers" | "documents" | "study-material" | "assignments" | "results" | "notices" | "gallery" | "settings";
  value?: string;
  onChange: (url: string) => void;
  allowedTypes?: string[]; // e.g. ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx"]
  maxSizeMB?: number; // defaults to 10MB
  label?: string;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  id,
  context,
  value,
  onChange,
  allowedTypes = ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx"],
  maxSizeMB = 10,
  label = "Upload File"
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setCurrentFile(file);
    setUploadProgress(0);

    const folderName = cloudinaryService.getFolderByContext(context);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validation = cloudinaryService.validateFile(file, {
      allowedTypes,
      maxSize: maxSizeBytes,
    });

    if (!validation.isValid) {
      setError(validation.error || "Invalid file.");
      setUploadProgress(null);
      return;
    }

    try {
      const result = await cloudinaryService.uploadFile(file, {
        folder: folderName,
        allowedTypes,
        maxSize: maxSizeBytes,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      onChange(result.secure_url);
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setError(err.message || "Something went wrong during file upload. Please retry.");
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

  const handleDelete = async () => {
    if (value) {
      const publicId = getPublicIdFromUrl(value);
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
    onChange("");
    setCurrentFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileExtension = value ? value.split(".").pop()?.toLowerCase() : "";
  const isImageValue = value && ["jpg", "jpeg", "png", "webp"].includes(fileExtension || "");
  const isPdfValue = value && fileExtension === "pdf";

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}

      <div
        id={`cloudinary-upload-container-${id}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 bg-slate-50/50 dark:bg-slate-900/30 ${
          isDragOver
            ? "border-brand-blue bg-blue-50/30 dark:bg-blue-900/10 scale-[0.99]"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
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
          {/* 1. Value preview (Image / File uploaded) */}
          {value && !uploadProgress ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center space-y-4"
            >
              {isImageValue ? (
                <div className="relative group rounded-xl overflow-hidden shadow-md max-w-xs border border-slate-100 dark:border-slate-800">
                  <img
                    src={getOptimizedImageUrl(value, context === "students" || context === "teachers" ? "profile" : "thumbnail")}
                    alt="Upload Preview"
                    className="h-32 w-auto object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white text-slate-800 rounded-full hover:bg-slate-100 shadow-sm transition-colors"
                      title="View Image"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm transition-colors"
                      title="Remove Image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : isPdfValue ? (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-sm w-full justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                        {value.split("/").pop() || "Document.pdf"}
                      </span>
                      <span className="text-[10px] text-slate-400">PDF Document</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Open PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-sm w-full justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 rounded-lg">
                      <File className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                        {value.split("/").pop() || "Attachment"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">{fileExtension || "FILE"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-brand-blue hover:underline cursor-pointer"
              >
                Replace file with another
              </button>
            </motion.div>
          ) : uploadProgress !== null ? (
            /* 2. Uploading state with cancellation */
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 flex flex-col items-center"
            >
              <RefreshCw className="h-7 w-7 text-brand-blue animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Uploading {currentFile?.name || "file"}...
              </p>
              
              <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div 
                  className="bg-brand-blue h-full transition-all duration-150" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between w-full max-w-xs mt-1.5 px-0.5 text-[10px]">
                <span className="text-slate-400">{uploadProgress}%</span>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-500 hover:text-red-600 hover:underline cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            /* 3. Empty state */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer py-3 flex flex-col items-center"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-brand-blue mb-2">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Drag and drop your file here, or <span className="text-brand-blue hover:underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Supports: {allowedTypes.join(", ").toUpperCase()} (Max {maxSizeMB}MB)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-500 mt-1 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-md border border-red-100/30">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
