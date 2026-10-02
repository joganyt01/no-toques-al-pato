function Duck({ x, y, direction }) {
  return (
    <div
      className={`duck ${direction === -1 ? "duck-left" : "duck-right"}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      🦆
    </div>
  );
}

export default Duck;