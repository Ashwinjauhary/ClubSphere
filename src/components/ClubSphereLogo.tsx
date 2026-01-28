import { useTheme } from '@mui/material';

interface ClubSphereLogoProps {
    size?: number;
    color?: string;
}

export const ClubSphereLogo = ({ size = 40, color }: ClubSphereLogoProps) => {
    const theme = useTheme();
    const primaryColor = color || theme.palette.primary.main;
    const secondaryColor = theme.palette.primary.dark;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="sphereGradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={primaryColor} />
                    <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Orbit Rings */}
            <path
                d="M50 15 C 70 15, 85 30, 85 50 C 85 70, 70 85, 50 85 C 30 85, 15 70, 15 50 C 15 30, 30 15, 50 15"
                stroke={primaryColor}
                strokeWidth="2"
                strokeOpacity="0.3"
                fill="none"
            />
            <path
                d="M85 50 C 85 30, 70 15, 50 15"
                stroke={primaryColor}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
            />
            <path
                d="M15 50 C 15 70, 30 85, 50 85"
                stroke={secondaryColor}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
            />

            {/* Central Sphere */}
            <circle cx="50" cy="50" r="18" fill="url(#sphereGradient)" filter="url(#glow)" />

            {/* Connecting Nodes/Satellites */}
            <circle cx="85" cy="50" r="4" fill={primaryColor} />
            <circle cx="25" cy="25" r="3" fill={secondaryColor} opacity="0.8" />
            <circle cx="50" cy="85" r="3" fill={secondaryColor} />

            {/* Stylized S shape inside (Optional, subtle) */}
            <path
                d="M45 42 C 45 42, 55 42, 55 50 C 55 58, 45 58, 45 58"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
            />
        </svg>
    );
};
