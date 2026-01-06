import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-all duration-300 hover:scale-110 animate-fade-in"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            )}
        </>
    );
};
