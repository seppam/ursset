"use client";

import { useEffect, useState } from "react";

/** Whole-number field that can be cleared and retyped without a stuck leading zero. */
export function IntInput({
  value,
  onChange,
  className,
  ...rest
}: { value: number; onChange: (n: number) => void; className?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [text, setText] = useState(String(value));

  // Follow changes made from outside (for example a reset), but never fight the user's typing.
  useEffect(() => {
    if (Number(text || 0) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      value={text}
      onFocus={e => {
        e.currentTarget.select();
        rest.onFocus?.(e);
      }}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        setText(digits);
        onChange(Number(digits || 0));
      }}
    />
  );
}
