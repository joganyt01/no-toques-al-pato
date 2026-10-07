import { forwardRef } from "react";

const Duck = forwardRef(function Duck(
  { x, y, direction },
  ref
) {
  return (
    <div
      ref={ref}
      className={`duck ${
        direction === -1
          ? "duck-left"
          : "duck-right"
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      🦆
    </div>
  );
});

export default Duck;