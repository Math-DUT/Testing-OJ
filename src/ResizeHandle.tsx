import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  axis: "x" | "y";
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onReset: () => void;
  measureSize?: () => number;
  className?: string;
};

/** Pointer capture keeps a drag attached to the divider outside its narrow hit area. */
export default function ResizeHandle({
  label,
  axis,
  value,
  min,
  max,
  onChange,
  onReset,
  measureSize,
  className = "",
}: Props) {
  const drag = useRef<{ start: number; value: number; size: number } | null>(
    null,
  );
  const [active, setActive] = useState(false);
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const finish = () => {
    drag.current = null;
    setActive(false);
    document.body.classList.remove("is-resizing");
    document.body.style.removeProperty("cursor");
  };
  useEffect(
    () => () => {
      if (drag.current) {
        document.body.classList.remove("is-resizing");
        document.body.style.removeProperty("cursor");
      }
    },
    [],
  );
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)}${measureSize ? "%" : "px"}`}
      tabIndex={0}
      title="拖动调整 · 双击还原"
      className={`resize-handle ${axis === "x" ? "vertical" : "horizontal"} ${active ? "dragging" : ""} ${className}`}
      onDoubleClick={onReset}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.focus();
        const size = measureSize?.() ?? 100;
        if (size <= 0) return;
        drag.current = {
          start: axis === "x" ? e.clientX : e.clientY,
          value,
          size,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        setActive(true);
        document.body.classList.add("is-resizing");
        document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const position = axis === "x" ? e.clientX : e.clientY;
        onChange(
          clamp(
            drag.current.value +
              ((position - drag.current.start) * 100) / drag.current.size,
          ),
        );
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onKeyDown={(e) => {
        const less = axis === "x" ? "ArrowLeft" : "ArrowUp";
        const more = axis === "x" ? "ArrowRight" : "ArrowDown";
        const step = measureSize ? (e.shiftKey ? 5 : 2) : e.shiftKey ? 40 : 12;
        if (![less, more, "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        onChange(
          e.key === "Home"
            ? min
            : e.key === "End"
              ? max
              : clamp(value + (e.key === more ? step : -step)),
        );
      }}
    />
  );
}
