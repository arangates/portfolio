"use client";

import { type ComponentProps, memo } from "react";

// Simple text component for message parts
// Directives are not supported in this simplified version
const DirectiveTextImpl = ({ className, ...props }: ComponentProps<"span">) => {
  return <span className={className} {...props} />;
};

export const DirectiveText = memo(DirectiveTextImpl);
