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
        {/* Left hand fingers coming up on left */}
        <path d="M9 4C9 3 8 2 7 2C6 2 5 3 5 4L5 11" />
        <path d="M7 4C7 3 6 2.5 5.5 3C5 3.5 5 4 5 5L5 11" />
        <path d="M9 4L9 11" />
        <path d="M11 5C11 4 10 3 9 4L9 11" />
        {/* Left palm and wrist */}
        <path d="M5 11C5 11 4 12 4 13.5C4 15 5 16 6 16.5L9 18" />
        {/* Right hand fingers coming up on right */}
        <path d="M15 4C15 3 16 2 17 2C18 2 19 3 19 4L19 11" />
        <path d="M17 4C17 3 18 2.5 18.5 3C19 3.5 19 4 19 5L19 11" />
        <path d="M15 4L15 11" />
        <path d="M13 5C13 4 14 3 15 4L15 11" />
        {/* Right palm and wrist */}
        <path d="M19 11C19 11 20 12 20 13.5C20 15 19 16 18 16.5L15 18" />
        {/* Joined palms at bottom */}
        <path d="M9 18C9 18 10 21 12 21C14 21 15 18 15 18" />
        <path d="M9 18L15 18" />
      </svg>
    );
  }
);
PrayingHands.displayName = "PrayingHands";
