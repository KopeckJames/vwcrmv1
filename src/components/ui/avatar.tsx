"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg";
}

const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
};

export function Avatar({
    src,
    alt,
    fallback,
    size = "md",
    className,
    ...props
}: AvatarProps) {
    const initials = getInitials(fallback || alt);

    if (src) {
        return (
            <div
                className={cn(
                    "relative rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800",
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                <img
                    src={src}
                    alt={alt || "Avatar"}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium",
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {initials}
        </div>
    );
}
