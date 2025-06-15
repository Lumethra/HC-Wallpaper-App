import React from 'react';

type NotificationType = 'success' | 'error' | 'warning';

interface NotificationOverlayProps {
    show: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: NotificationType;
    buttonText?: string;
    showDownloadButton?: boolean;
    downloadPath?: string;
}

export default function NotificationOverlay({
    show,
    onClose,
    title,
    message,
    type = 'success',
    buttonText = 'Great!',
    showDownloadButton = false,
    downloadPath = ''
}: NotificationOverlayProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                            type === 'error' ? 'bg-red-100 dark:bg-red-900' :
                                'bg-yellow-100 dark:bg-yellow-900'
                        }`}>
                        {type === 'success' ? (
                            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : type === 'error' ? (
                            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className={`w-full px-4 py-2 text-white rounded-md transition-colors ${type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                                type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                                    'bg-yellow-500 hover:bg-yellow-600'
                            }`}
                    >
                        {buttonText}
                    </button>

                    {showDownloadButton && downloadPath && (
                        <a
                            href={downloadPath}
                            download
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mt-2 text-center block"
                        >
                            Download Wallpaper
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}