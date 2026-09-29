function Target({ x, y, onHit }) {
  return (
    <button
      className="target"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      onClick={onHit}
    >
      🎯
    </button>
  );
}

export default Target;