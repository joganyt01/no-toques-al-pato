import { useEffect, useRef, useState } from "react";
import Target from "./Target";
import Duck from "./Duck";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import "./Game.css";

function Game() {
  const videoRef = useRef(null);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [fingerPosition, setFingerPosition] = useState(null);

  const [target, setTarget] = useState({
  x: 50,
  y: 50,
});

const [score, setScore] = useState(0);

const [duck, setDuck] = useState({
  x: 30,
  y: 40,
});

const [gameOver, setGameOver] = useState(false);
function generateTarget() {
  const x = Math.random() * 80 + 10;
  const y = Math.random() * 70 + 15;

  setTarget({
    x,
    y,
  });
}

function checkTargetCollision() {
  if (!fingerPosition) return;

  const distance = Math.sqrt(
    Math.pow(fingerPosition.x * 100 - (100 - target.x), 2) +
    Math.pow(fingerPosition.y * 100 - target.y, 2)
  );

  if (distance < 8) {
    setScore((previousScore) => previousScore + 1);
    generateTarget();
  }
}
function checkDuckCollision() {
  if (!fingerPosition || gameOver) return;

  const fingerX = 100 - fingerPosition.x * 100;
  const fingerY = fingerPosition.y * 100;

  const distance = Math.sqrt(
    Math.pow(fingerX - duck.x, 2) +
    Math.pow(fingerY - duck.y, 2)
  );

  console.log("🦆 Colisión:", {
    fingerX,
    fingerY,
    duckX: duck.x,
    duckY: duck.y,
    distance,
  });

  if (distance < 15) {
    console.log("💀 TOCASTE AL PATO");
    setGameOver(true);
  }
}

  // Preparar MediaPipe
  useEffect(() => {
    async function setupHandDetection() {
      try {
       const vision = await FilesetResolver.forVisionTasks(
  `${import.meta.env.BASE_URL}wasm`
);

        const detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        setHandLandmarker(detector);

        console.log("✅ Detector de manos listo");
      } catch (error) {
        console.error("❌ Error preparando MediaPipe:", error);
      }
    }

    setupHandDetection();
  }, []);

  // Activar cámara
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("❌ Error al acceder a la cámara:", error);
      }
    }

    startCamera();

    // Apagar cámara cuando salgamos del juego
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // Detectar dedo
  useEffect(() => {
    if (!handLandmarker) return;

    let animationFrame;

    function detectHand() {
      if (!videoRef.current) return;

      if (videoRef.current.readyState >= 2) {
        const results = handLandmarker.detectForVideo(
          videoRef.current,
          performance.now()
        );

        if (results.landmarks.length > 0) {
          const indexFinger = results.landmarks[0][8];

          setFingerPosition({
            x: indexFinger.x,
            y: indexFinger.y,
          });
        } else {
          setFingerPosition(null);
        }
      }

      animationFrame = requestAnimationFrame(detectHand);
    }

    detectHand();

   
  }, [handLandmarker]);

  

   // Detectar colisión con el objetivo
 useEffect(() => {
  if (!fingerPosition || gameOver) return;

  checkTargetCollision();
  checkDuckCollision();
}, [fingerPosition, gameOver]);

  return (
    <div className="game">

      {/* Cámara */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera"
      />

<Target
  x={target.x}
  y={target.y}
  onHit={generateTarget}
/>

<Duck
  x={duck.x}
  y={duck.y}
/>

      {/* Puntero del dedo */}
      {fingerPosition && (
        <div
          className="finger-pointer"
          style={{
            left: `${100 - fingerPosition.x * 100}%`,
            top: `${fingerPosition.y * 100}%`,
          }}
        >
          👆
        </div>
      )}

      {/* Interfaz */}
<div className="game-ui">
  <h1>🦆 NO TOQUES AL PATO</h1>

  <div className="score">
    🎯 {score}
  </div>

  <div className="status">
    {handLandmarker
      ? fingerPosition
        ? "🟢 Dedo detectado"
        : "🟡 Muestra tu mano"
      : "🔵 Cargando detector..."}
  </div>
</div>

{/* Game Over */}
{gameOver && (
  <div className="game-over">
    <div className="game-over-box">
      <div className="game-over-duck">💀🦆</div>

      <h2>¡TOCASTE AL PATO!</h2>

      <p>Tu puntuación</p>

      <div className="final-score">
        🎯 {score}
      </div>

      <button
        className="restart-button"
        onClick={() => window.location.reload()}
      >
        🔄 JUGAR DE NUEVO
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default Game;