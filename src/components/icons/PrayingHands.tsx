import * as React from "react";

export const PrayingHands = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ color = "currentColor", className, ...props }, ref) => {
    const size = (props as any).size ?? 24;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color as string}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Left hand sleeve */}
        <path d="M3.5 17L7.5 15.5L9.5 21L5.5 22.5Z" />
        <path d="M5.5 16.2L8.5 18" />

        {/* Right hand sleeve */}
        <path d="M20.5 17L16.5 15.5L14.5 21L18.5 22.5Z" />
        <path d="M18.5 16.2L15.5 18" />

        {/* Hands profile */}
        <path d="M7.5 15.5C8 14.5 10 11 10.5 7.5C11 4 12 3 12 3" />
        <path d="M16.5 15.5C16 14.5 14 11 13.5 7.5C13 4 12 3 12 3" />

        {/* Thumbs inner lines */}
        <path d="M10.5 12C10.5 12 11 9 12 8" />
        <path d="M13.5 12C13.5 12 13 9 12 8" />
        
        {/* Center line separating hands */}
        <path d="M12 3V16.5" />
      </svg>
    );
  }
);
PrayingHands.displayName = "PrayingHands";
