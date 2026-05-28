import * as React from "react";

export const PrayingHands = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ color = "currentColor", size = 24, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M14.5 14c0-1.5 1.5-2.5 3-4.5s1-3 1-5c0-1.5-1.5-2.5-3-2.5s-2.5 1-3 3v2" />
        <path d="M9.5 14c0-1.5-1.5-2.5-3-4.5s-1-3-1-5c0-1.5 1.5-2.5 3-2.5s2.5 1 3 3v2" />
        <path d="M12 7v14" />
        <path d="M12 21H9c-2.5 0-4-2-4-4v-1.5c0-1.5.5-3 1.5-4C8 10 9 9 10 9h4c1 0 2 1 3.5 2.5 1 1 1.5 2.5 1.5 4V17c0 2-1.5 4-4 4h-3z" />
      </svg>
    );
  }
);
PrayingHands.displayName = "PrayingHands";
