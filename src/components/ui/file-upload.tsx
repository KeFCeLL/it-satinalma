"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useDropzone, FileRejection, ErrorCode, FileError } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: Record<string, string[]>;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // Default 5MB
  acceptedTypes,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Maksimum dosya sayısı kontrolü
      if (files.length + acceptedFiles.length > maxFiles) {
        setErrors([`En fazla ${maxFiles} dosya yükleyebilirsiniz.`]);
        return;
      }

      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);

      // Hata mesajlarını işleme
      const errorMessages: string[] = [];
      fileRejections.forEach((file) => {
        file.errors.forEach((err: FileError) => {
          if (err.code === 'file-too-large') {
            errorMessages.push(`"${file.file.name}" boyutu çok büyük. Maksimum ${formatBytes(maxSize)}.`);
          } else if (err.code === 'file-invalid-type') {
            errorMessages.push(`"${file.file.name}" için geçersiz dosya tipi.`);
          } else {
            errorMessages.push(`${file.file.name}: ${err.message}`);
          }
        });
      });

      if (errorMessages.length > 0) {
        setErrors(errorMessages);
      }
    },
    [files, maxFiles, maxSize, onFilesSelected]
  );

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter((file) => file !== fileToRemove);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes,
  });

  // Dosya boyutunu formatlamak için yardımcı fonksiyon
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer flex flex-col items-center justify-center gap-2",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          className
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-center text-muted-foreground">
          {isDragActive ? (
            <span className="font-medium">Dosyaları buraya bırakın</span>
          ) : (
            <>
              <span className="font-medium">Dosya seçmek için tıklayın</span> veya dosyaları buraya sürükleyin
            </>
          )}
        </p>
        <p className="text-xs text-center text-muted-foreground">
          Maksimum {maxFiles} dosya, her biri {formatBytes(maxSize)} boyutunda
        </p>
      </div>

      {/* Yüklenen dosyalar listesi */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Yüklenen Dosyalar</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hata mesajları */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 p-3 rounded-md space-y-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">Yükleme Hataları</p>
          </div>
          <ul className="space-y-1 list-disc list-inside text-sm text-destructive">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              clearErrors();
            }}
          >
            Hataları Temizle
          </Button>
        </div>
      )}
    </div>
  );
} 