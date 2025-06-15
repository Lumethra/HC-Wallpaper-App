"use client";

import { useState, useEffect, useRef } from 'react';
import { uploadAndSetWallpaper } from '../utils/wallpaper';
import NotificationOverlay from './NotificationOverlay';

export default function WallpaperUploader() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{
        message: string;
        success: boolean | null;
    }>({ message: '', success: null });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (showSuccessPopup) {
            const timer = setTimeout(() => {
                setShowSuccessPopup(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessPopup]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);

            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    setPreviewUrl(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setStatus({ message: '', success: null });

        try {
            const result = await uploadAndSetWallpaper(selectedFile);

            setStatus({
                message: result.message,
                success: result.success
            });

            if (result.success) {
                setShowSuccessPopup(true);

                if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                setSelectedFile(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            setStatus({
                message: error instanceof Error ? error.message : 'An unknown error occurred',
                success: false
            });
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-[0_0_0_2px_#10b981] hover:scale-105">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <span className="text-green-500">📤</span>
                    Upload New Wallpaper
                </h2>

                {selectedFile && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 break-all">
                        <p className="truncate">{selectedFile.name}</p>
                        <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer mb-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-green-400 dark:hover:border-green-500"
                >
                    {previewUrl ? (
                        <div className="relative group">
                            <img
                                src={previewUrl}
                                alt="Wallpaper preview"
                                className="w-full h-auto rounded-lg object-contain max-h-96"
                            />
                            <div className="absolute inset-0 bg-opacity-0 group-hover:bg-black/40 flex items-center justify-center rounded-lg transition-all">
                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Change image</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mt-4 text-gray-700 dark:text-gray-300">Click to select an image</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${!selectedFile || isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : 'Set as Wallpaper'}
                </button>

                {status.message && status.success === false && (
                    <div className="mt-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900">
                        {status.message}
                    </div>
                )}
            </div>

            <NotificationOverlay
                show={showSuccessPopup}
                onClose={() => setShowSuccessPopup(false)}
                title="Wallpaper Set Successfully!"
                message="Your new wallpaper has been applied."
                type="success"
                buttonText="Great!"
            />
        </>
    );
}