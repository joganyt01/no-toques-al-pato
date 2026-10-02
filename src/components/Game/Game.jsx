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

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Tiempo que lleva viva la partida
  const [gameTime, setGameTime] = useState(0);

  // =========================
  // OBSTÁCULOS
  // =========================

  const [targets, setTargets] = useState([
    { id: 1, x: 20, y: 25 },
    { id: 2, x: 75, y: 25 },
    { id: 3, x: 25, y: 70 },
    { id: 4, x: 75, y: 70 },
    { id: 5, x: 50, y: 50 },
  ]);

  // =========================
  // PATO
  // =========================

  const [duck, setDuck] = useState({
    x: 30,
    y: 40,
    directionX: 1,
    directionY: 1,
  });

  // =========================
  // CRONÓMETRO
  // =========================

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setGameTime((previousTime) => previousTime + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [gameOver]);

  // =========================
  // MOVIMIENTO DEL PATO
  // =========================

  useEffect(() => {
    if (gameOver) return;

    const duckMovement = setInterval(() => {
      setDuck((currentDuck) => {

        // =========================
        // VELOCIDAD PROGRESIVA
        // =========================

        // Empieza relativamente rápido.
        // Cada 5 segundos aumenta la velocidad.
        const speed =
          1.4 +
          Math.floor(gameTime / 5) * 0.25;

        // Límite para que no llegue a ser
        // completamente imposible.
        const finalSpeed = Math.min(
          speed,
          4
        );

        let newX =
          currentDuck.x +
          currentDuck.directionX *
            finalSpeed;

        let newY =
          currentDuck.y +
          currentDuck.directionY *
            finalSpeed;

        let newDirectionX =
          currentDuck.directionX;

        let newDirectionY =
          currentDuck.directionY;

        // =========================
        // REBOTE HORIZONTAL
        // =========================

        if (newX >= 85) {
          newX = 85;
          newDirectionX = -1;
        }

        if (newX <= 15) {
          newX = 15;
          newDirectionX = 1;
        }

        // =========================
        // REBOTE VERTICAL
        // =========================

        if (newY >= 80) {
          newY = 80;
          newDirectionY = -1;
        }

        if (newY <= 20) {
          newY = 20;
          newDirectionY = 1;
        }

        return {
          x: newX,
          y: newY,
          directionX: newDirectionX,
          directionY: newDirectionY,
        };
      });
    }, 50);

    return () => {
      clearInterval(duckMovement);
    };
  }, [gameOver, gameTime]);

  // =========================
  // PREPARAR MEDIAPIPE
  // =========================

  useEffect(() => {
    async function setupHandDetection() {
      try {
        const vision =
          await FilesetResolver.forVisionTasks(
            `${import.meta.env.BASE_URL}wasm`
          );

        const detector =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 1,
            }
          );

        setHandLandmarker(detector);

        console.log(
          "✅ Detector de manos listo"
        );
      } catch (error) {
        console.error(
          "❌ Error preparando MediaPipe:",
          error
        );
      }
    }

    setupHandDetection();
  }, []);

  // =========================
  // ACTIVAR CÁMARA
  // =========================

  useEffect(() => {
    async function startCamera() {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
            },
            audio: false,
          });

        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error(
          "❌ Error al acceder a la cámara:",
          error
        );
      }
    }

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================
  // DETECTAR DEDO
  // =========================

  useEffect(() => {
    if (!handLandmarker) return;

    let animationFrame;

    function detectHand() {
      if (!videoRef.current) return;

      if (videoRef.current.readyState >= 2) {
        const results =
          handLandmarker.detectForVideo(
            videoRef.current,
            performance.now()
          );

        if (results.landmarks.length > 0) {
          const indexFinger =
            results.landmarks[0][8];

          setFingerPosition({
            x: indexFinger.x,
            y: indexFinger.y,
          });
        } else {
          setFingerPosition(null);
        }
      }

      animationFrame =
        requestAnimationFrame(detectHand);
    }

    detectHand();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [handLandmarker]);

  // =========================
  // GENERAR NUEVA POSICIÓN
  // =========================

  function generateNewTargetPosition(
    currentTarget
  ) {
    let newX;
    let newY;

    let validPosition = false;

    while (!validPosition) {
      newX = Math.random() * 70 + 15;
      newY = Math.random() * 55 + 22;

      validPosition = true;

      // Evitar que aparezca demasiado cerca
      // de otro objetivo.
      for (const target of targets) {
        if (target.id === currentTarget.id) {
          continue;
        }

        const distance = Math.sqrt(
          Math.pow(newX - target.x, 2) +
          Math.pow(newY - target.y, 2)
        );

        if (distance < 14) {
          validPosition = false;
          break;
        }
      }

      // Evitar que aparezca encima del pato.
      const distanceToDuck =
        Math.sqrt(
          Math.pow(newX - duck.x, 2) +
          Math.pow(newY - duck.y, 2)
        );

      if (distanceToDuck < 15) {
        validPosition = false;
      }
    }

    return {
      x: newX,
      y: newY,
    };
  }

  // =========================
  // COLISIONES
  // =========================

  useEffect(() => {
    if (!fingerPosition || gameOver) return;

    const fingerX =
      100 - fingerPosition.x * 100;

    const fingerY =
      fingerPosition.y * 100;

    // =========================
    // 🎯 OBJETIVOS
    // =========================

    for (const target of targets) {
      const distanceToTarget =
        Math.sqrt(
          Math.pow(
            fingerX - target.x,
            2
          ) +
          Math.pow(
            fingerY - target.y,
            2
          )
        );

      if (distanceToTarget < 8) {

        // Sumar punto
        setScore(
          (previousScore) =>
            previousScore + 1
        );

        // Crear nuevo objetivo
        const newPosition =
          generateNewTargetPosition(
            target
          );

        setTargets((currentTargets) =>
          currentTargets.map(
            (currentTarget) =>
              currentTarget.id ===
              target.id
                ? {
                    ...currentTarget,
                    x: newPosition.x,
                    y: newPosition.y,
                  }
                : currentTarget
          )
        );

        return;
      }
    }

    // =========================
    // 🦆 PATO
    // =========================

    const distanceToDuck =
      Math.sqrt(
        Math.pow(
          fingerX - duck.x,
          2
        ) +
        Math.pow(
          fingerY - duck.y,
          2
        )
      );

    if (distanceToDuck < 15) {
      console.log(
        "💀 TOCASTE AL PATO"
      );

      setGameOver(true);
    }
  }, [
    fingerPosition,
    duck,
    targets,
    gameOver,
  ]);

  // =========================
  // INTERFAZ
  // =========================

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

      {/* =========================
          OBJETIVOS
      ========================= */}

      {targets.map((target) => (
        <Target
          key={target.id}
          x={target.x}
          y={target.y}
          onHit={() => {
            setScore(
              (previousScore) =>
                previousScore + 1
            );

            const newPosition =
              generateNewTargetPosition(
                target
              );

            setTargets(
              (currentTargets) =>
                currentTargets.map(
                  (currentTarget) =>
                    currentTarget.id ===
                    target.id
                      ? {
                          ...currentTarget,
                          x: newPosition.x,
                          y: newPosition.y,
                        }
                      : currentTarget
                )
            );
          }}
        />
      ))}

      {/* =========================
          PATO
      ========================= */}

      <Duck
        x={duck.x}
        y={duck.y}
        direction={duck.directionX}
      />

      {/* =========================
          PUNTERO
      ========================= */}

      {fingerPosition && (
        <div
          className="finger-pointer"
          style={{
            left: `${
              100 -
              fingerPosition.x * 100
            }%`,
            top: `${
              fingerPosition.y * 100
            }%`,
          }}
        >
          👆
        </div>
      )}

      {/* =========================
          HUD
      ========================= */}

      <div className="game-ui">

        <h1>🦆 TOCA AL PATO</h1>

        <div className="score">
          🎯 {score}
        </div>

        <div className="status">
          {handLandmarker
            ? fingerPosition
              ? "🟢 ¡TOCA LOS OBJETIVOS!"
              : "🟡 Muestra tu mano"
            : "🔵 Cargando detector..."}
        </div>

      </div>

      {/* =========================
          GAME OVER
      ========================= */}

      {gameOver && (
        <div className="game-over">

          <div className="game-over-box">

            <div className="game-over-duck">
              💀🦆
            </div>

            <h2>
              ¡TOCASTE AL PATO!
            </h2>

            <p>
              Tu puntuación
            </p>

            <div className="final-score">
              🎯 {score}
            </div>

            <button
              className="restart-button"
              onClick={() =>
                window.location.reload()
              }
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