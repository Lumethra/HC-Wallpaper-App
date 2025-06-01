'use client';

import { useEffect } from 'react';

export default function ScrollbarPaddingAdjuster() {
    useEffect(() => {
        const adjustPadding = () => {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;

            if (hasScrollbar && scrollbarWidth > 0) {
                document.body.style.paddingRight = `${15 - scrollbarWidth}px`;
            } else {
                document.body.style.paddingRight = '15px';
            }
        };

        adjustPadding();

        window.addEventListener('resize', adjustPadding);

        const observer = new MutationObserver(() => {
            setTimeout(adjustPadding, 0);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            window.removeEventListener('resize', adjustPadding);
            observer.disconnect();
            document.body.style.paddingRight = '15px';
        };
    }, []);

    return null;
}