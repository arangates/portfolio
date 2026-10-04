import * as React from "react";

export function IconSwap({
  first,
  second,
  swapped,
  className,
  dataIcon,
}: {
  first: React.ReactNode;
  second: React.ReactNode;
  swapped: boolean;
  className?: string;
  dataIcon?: string;
}) {
  return (
    <span
      className={className ? `t-icon-swap ${className}` : "t-icon-swap"}
      data-state={swapped ? "second" : "first"}
      data-icon={dataIcon}
    >
      <span data-swap-icon="first" aria-hidden="true">
        {first}
      </span>
      <span data-swap-icon="second" aria-hidden="true">
        {second}
      </span>
    </span>
  );
}
