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

  // =========================
  // AUDIOS
  // =========================

  const targetSoundRef = useRef(null);
  const duckSoundRef = useRef(null);
  const songRef = useRef(null);

  const gameOverSoundPlayedRef = useRef(false);
  const songTimeoutRef = useRef(null);
  const songFadeIntervalRef = useRef(null);

  // =========================
  // ESTADOS
  // =========================

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [fingerPosition, setFingerPosition] = useState(null);

  const fingerPositionRef = useRef(null);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Tiempo que lleva viva la partida
  const [gameTime, setGameTime] = useState(0);

  // =========================
  // PREPARAR AUDIOS
  // =========================

  useEffect(() => {
    targetSoundRef.current = new Audio(
      `${import.meta.env.BASE_URL}objetivos.mp3`
    );

    duckSoundRef.current = new Audio(
      `${import.meta.env.BASE_URL}pato.mp3`
    );

    songRef.current = new Audio(
      `${import.meta.env.BASE_URL}severa.mp3`
    );

    // La canción solamente se reproduce cuando se pierde.
    songRef.current.loop = true;

    // Comienza en silencio para hacer fade-in.
    songRef.current.volume = 0;

    return () => {
      if (songTimeoutRef.current) {
        clearTimeout(songTimeoutRef.current);
      }

      if (songFadeIntervalRef.current) {
        clearInterval(songFadeIntervalRef.current);
      }

      targetSoundRef.current?.pause();
      duckSoundRef.current?.pause();
      songRef.current?.pause();

      if (songRef.current) {
        songRef.current.currentTime = 0;
      }
    };
  }, []);

  // =========================
  // SONIDO OBJETIVO
  // =========================

  function playTargetSound() {
    const sound = targetSoundRef.current;

    if (!sound) return;

    sound.currentTime = 0;

    sound.play().catch((error) => {
      console.log(
        "No se pudo reproducir el sonido del objetivo:",
        error
      );
    });
  }

  // =========================
  // GAME OVER + SONIDOS
  // =========================

  function playGameOverSounds() {
    // Evitar que se ejecute más de una vez
    // durante la misma derrota.
    if (gameOverSoundPlayedRef.current) {
      return;
    }

    gameOverSoundPlayedRef.current = true;

    // =========================
    // 🦆 SONIDO DEL PATO
    // =========================

    const duckSound = duckSoundRef.current;

    if (duckSound) {
      duckSound.currentTime = 0;

      duckSound.play().catch((error) => {
        console.log(
          "No se pudo reproducir el sonido del pato:",
          error
        );
      });
    }

    // =========================
    // 🎵 CANCIÓN
    // =========================

    songTimeoutRef.current = setTimeout(() => {
      const song = songRef.current;

      if (!song) return;

      // Asegurarnos de empezar desde el principio.
      song.pause();
      song.currentTime = 0;
      song.volume = 0;

      song.play().catch((error) => {
        console.log(
          "No se pudo reproducir la canción:",
          error
        );
      });

      // =========================
      // FADE IN
      // =========================

      let volume = 0;

      songFadeIntervalRef.current =
        setInterval(() => {
          volume += 0.05;

          if (volume >= 1) {
            volume = 1;

            clearInterval(
              songFadeIntervalRef.current
            );

            songFadeIntervalRef.current = null;
          }

          song.volume = volume;
        }, 100);

    }, 500);
  }

  // =========================
  // DETENER CANCIÓN
  // =========================

  function stopGameOverMusic() {
    if (songTimeoutRef.current) {
      clearTimeout(songTimeoutRef.current);

      songTimeoutRef.current = null;
    }

    if (songFadeIntervalRef.current) {
      clearInterval(
        songFadeIntervalRef.current
      );

      songFadeIntervalRef.current = null;
    }

    const song = songRef.current;

    if (song) {
      song.pause();
      song.currentTime = 0;
      song.volume = 0;
    }
  }

  // =========================
  // REINICIAR PARTIDA
  // =========================

  function restartGame() {
    stopGameOverMusic();

    gameOverSoundPlayedRef.current = false;

    setScore(0);
    setGameTime(0);
    setGameOver(false);
    setFingerPosition(null);

    setTargets([
      { id: 1, x: 20, y: 25 },
      { id: 2, x: 75, y: 25 },
      { id: 3, x: 25, y: 70 },
      { id: 4, x: 75, y: 70 },
      { id: 5, x: 50, y: 50 },
    ]);

    setDuck({
      x: 30,
      y: 40,
      directionX: 1,
      directionY: 1,
    });
  }

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
      setGameTime(
        (previousTime) =>
          previousTime + 1
      );
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

        const speed =
          2.5 +
          Math.floor(gameTime / 5) * 0.25;

        const finalSpeed = Math.min(
          speed,
          5.0
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
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, []);

  // =========================
  // DETECTAR DEDO
  // =========================

 useEffect(() => {
  if (!handLandmarker) return;

  let animationFrame;
  let lastDetectionTime = 0;

  function detectHand(timestamp) {
    if (!videoRef.current) return;

    // Limitamos la detección aproximadamente a 30 FPS.
    // Esto reduce bastante la carga en celulares.
    if (timestamp - lastDetectionTime >= 33) {
      lastDetectionTime = timestamp;

      if (videoRef.current.readyState >= 2) {
        const results =
          handLandmarker.detectForVideo(
            videoRef.current,
            timestamp
          );

        if (results.landmarks.length > 0) {
          const indexFinger =
            results.landmarks[0][8];

          const newPosition = {
            x: indexFinger.x,
            y: indexFinger.y,
          };

          // Guardamos la posición inmediatamente
          // sin provocar un render de React.
          fingerPositionRef.current =
            newPosition;

          // Actualizamos solamente la posición
          // visual que utiliza React.
          setFingerPosition(newPosition);
        } else {
          fingerPositionRef.current = null;
          setFingerPosition(null);
        }
      }
    }

    animationFrame =
      requestAnimationFrame(detectHand);
  }

  animationFrame =
    requestAnimationFrame(detectHand);

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
      newX =
        Math.random() * 70 + 15;

      newY =
        Math.random() * 55 + 22;

      validPosition = true;

      // Evitar que aparezca demasiado cerca
      // de otro objetivo.
      for (const target of targets) {
        if (
          target.id ===
          currentTarget.id
        ) {
          continue;
        }

        const distance =
          Math.sqrt(
            Math.pow(
              newX - target.x,
              2
            ) +
            Math.pow(
              newY - target.y,
              2
            )
          );

        if (distance < 14) {
          validPosition = false;
          break;
        }
      }

      // Evitar que aparezca encima del pato.
      const distanceToDuck =
        Math.sqrt(
          Math.pow(
            newX - duck.x,
            2
          ) +
          Math.pow(
            newY - duck.y,
            2
          )
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
  // ACERTAR OBJETIVO
  // =========================

  function hitTarget(target) {
    // Sonido inmediatamente.
    playTargetSound();

    // Sumar punto.
    setScore(
      (previousScore) =>
        previousScore + 1
    );

    // Crear nueva posición.
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
  }

  // =========================
  // PERDER
  // =========================

  function loseGame() {
    if (gameOver) return;

    console.log(
      "💀 TOCASTE AL PATO"
    );

    setGameOver(true);

    playGameOverSounds();
  }

  // =========================
  // COLISIONES
  // =========================

  useEffect(() => {
    if (!fingerPosition || gameOver) {
      return;
    }

    const fingerX =
      100 -
      fingerPosition.x * 100;

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

      if (
        distanceToTarget < 8
      ) {
        hitTarget(target);
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

    if (
      distanceToDuck < 15
    ) {
      loseGame();
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
          onHit={() =>
            hitTarget(target)
          }
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
              fingerPosition.x *
                100
            }%`,
            top: `${
              fingerPosition.y *
              100
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

        <h1>
          🦆 SI TOCAS AL PATO
          ERES GAY
        </h1>

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
        <div className="game-over screen-flash">

          <div className="game-over-box">

            <div className="game-over-duck">
              🦆
            </div>

            <h2>
              ¡AYY, SEVERA LOCA!
            </h2>

            <div className="crazy-gif">
              <img
                src={`${import.meta.env.BASE_URL}loca.gif`}
                alt="Loca"
              />
            </div>

            <p>
              Puntaje final
            </p>

            <div className="final-score">
              🎯 {score}
            </div>

            <button
              className="restart-button"
              onClick={restartGame}
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