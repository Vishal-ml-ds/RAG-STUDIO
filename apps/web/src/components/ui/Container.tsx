import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ContainerSize = "narrow" | "default" | "wide" | "full";

const SIZE: Record<ContainerSize, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  as?: ElementType;
  children: ReactNode;
}

export function Container({
  size = "default",
  as: Tag = "div",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full px-6 sm:px-8", SIZE[size], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
