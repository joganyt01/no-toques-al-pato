function Duck({ x, y }) {
  return (
    <div
      className="duck"
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