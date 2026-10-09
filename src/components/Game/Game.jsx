import {
  useEffect,
  useRef,
  useState,
} from "react";

import Target from "./Target";
import Duck from "./Duck";

import "./Game.css";

function Game() {
  const videoRef = useRef(null);
  const duckRef = useRef(null);

  // =========================
  // AUDIOS
  // =========================

  const targetSoundRef = useRef(null);
  const duckSoundRef = useRef(null);
  const songRef = useRef(null);

  const gameOverSoundPlayedRef =
    useRef(false);

  const songTimeoutRef =
    useRef(null);

  const songFadeIntervalRef =
    useRef(null);

  // =========================
  // WEB WORKER
  // =========================

  const workerRef = useRef(null);

  const workerBusyRef =
    useRef(false);

  const detectionStatsRef = useRef({
    count: 0,
    processing: 0,
    capture: 0,
    roundTrip: 0,
  });

  // =========================
  // POSICIÓN DEL DEDO
  // =========================

  const fingerPositionRef =
    useRef(null);

  const fingerPointerRef =
    useRef(null);

  // =========================
  // ESTADOS
  // =========================

  const [
    fingerDetected,
    setFingerDetected,
  ] = useState(false);

  const [
    detectorReady,
    setDetectorReady,
  ] = useState(false);

  const [
    score,
    setScore,
  ] = useState(0);

  const [
    gameOver,
    setGameOver,
  ] = useState(false);

  const [
    gameTime,
    setGameTime,
  ] = useState(0);

  // =========================
  // OBJETIVOS
  // =========================

  const [
    targets,
    setTargets,
  ] = useState([
    {
      id: 1,
      x: 20,
      y: 25,
    },
    {
      id: 2,
      x: 75,
      y: 25,
    },
    {
      id: 3,
      x: 25,
      y: 70,
    },
    {
      id: 4,
      x: 75,
      y: 70,
    },
    {
      id: 5,
      x: 50,
      y: 50,
    },
  ]);

  const targetsRef =
    useRef(targets);

  useEffect(() => {
    targetsRef.current =
      targets;
  }, [targets]);

  // =========================
  // PATO
  // =========================

  const [
    duck,
    setDuck,
  ] = useState({
    x: 30,
    y: 40,
    directionX: 1,
    directionY: 1,
  });

  const duckStateRef =
    useRef({
      x: 30,
      y: 40,
      directionX: 1,
      directionY: 1,
    });

  const gameOverRef =
    useRef(false);

  const gameTimeRef =
    useRef(0);

  useEffect(() => {
    gameOverRef.current =
      gameOver;
  }, [gameOver]);

  useEffect(() => {
    gameTimeRef.current =
      gameTime;
  }, [gameTime]);

  // =========================
  // PREPARAR AUDIOS
  // =========================

  useEffect(() => {
    targetSoundRef.current =
      new Audio(
        `${import.meta.env.BASE_URL}objetivos.mp3`
      );

    duckSoundRef.current =
      new Audio(
        `${import.meta.env.BASE_URL}pato.mp3`
      );

    songRef.current =
      new Audio(
        `${import.meta.env.BASE_URL}severa.mp3`
      );

    songRef.current.loop =
      true;

    songRef.current.volume =
      0;

    return () => {
      if (songTimeoutRef.current) {
        clearTimeout(
          songTimeoutRef.current
        );
      }

      if (
        songFadeIntervalRef.current
      ) {
        clearInterval(
          songFadeIntervalRef.current
        );
      }

      targetSoundRef.current?.pause();

      duckSoundRef.current?.pause();

      songRef.current?.pause();

      if (songRef.current) {
        songRef.current.currentTime =
          0;
      }
    };
  }, []);

  // =========================
  // SONIDO OBJETIVO
  // =========================

  function playTargetSound() {
    const sound =
      targetSoundRef.current;

    if (!sound) {
      return;
    }

    sound.currentTime = 0;

    sound
      .play()
      .catch((error) => {
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
    if (
      gameOverSoundPlayedRef.current
    ) {
      return;
    }

    gameOverSoundPlayedRef.current =
      true;

    const duckSound =
      duckSoundRef.current;

    if (duckSound) {
      duckSound.currentTime =
        0;

      duckSound
        .play()
        .catch((error) => {
          console.log(
            "No se pudo reproducir el sonido del pato:",
            error
          );
        });
    }

    songTimeoutRef.current =
      setTimeout(() => {
        const song =
          songRef.current;

        if (!song) {
          return;
        }

        song.pause();

        song.currentTime =
          0;

        song.volume =
          0;

        song
          .play()
          .catch((error) => {
            console.log(
              "No se pudo reproducir la canción:",
              error
            );
          });

        let volume = 0;

        songFadeIntervalRef.current =
          setInterval(() => {
            volume += 0.05;

            if (volume >= 1) {
              volume = 1;

              clearInterval(
                songFadeIntervalRef.current
              );

              songFadeIntervalRef.current =
                null;
            }

            song.volume =
              volume;
          }, 100);
      }, 500);
  }

  // =========================
  // DETENER CANCIÓN
  // =========================

  function stopGameOverMusic() {
    if (songTimeoutRef.current) {
      clearTimeout(
        songTimeoutRef.current
      );

      songTimeoutRef.current =
        null;
    }

    if (
      songFadeIntervalRef.current
    ) {
      clearInterval(
        songFadeIntervalRef.current
      );

      songFadeIntervalRef.current =
        null;
    }

    const song =
      songRef.current;

    if (song) {
      song.pause();

      song.currentTime =
        0;

      song.volume =
        0;
    }
  }

  // =========================
  // REINICIAR
  // =========================

  function restartGame() {
    stopGameOverMusic();

    gameOverSoundPlayedRef.current =
      false;

    gameOverRef.current =
      false;

    fingerPositionRef.current =
      null;

    setFingerDetected(
      false
    );

    setScore(0);

    setGameTime(0);

    setGameOver(false);

    const initialTargets = [
      {
        id: 1,
        x: 20,
        y: 25,
      },
      {
        id: 2,
        x: 75,
        y: 25,
      },
      {
        id: 3,
        x: 25,
        y: 70,
      },
      {
        id: 4,
        x: 75,
        y: 70,
      },
      {
        id: 5,
        x: 50,
        y: 50,
      },
    ];

    targetsRef.current =
      initialTargets;

    setTargets(
      initialTargets
    );

    const initialDuck = {
      x: 30,
      y: 40,
      directionX: 1,
      directionY: 1,
    };

    duckStateRef.current =
      initialDuck;

    setDuck(initialDuck);

    if (duckRef.current) {
      duckRef.current.style.left =
        `${initialDuck.x}%`;

      duckRef.current.style.top =
        `${initialDuck.y}%`;
    }
  }

  // =========================
  // CRONÓMETRO
  // =========================

  useEffect(() => {
    if (gameOver) {
      return;
    }

    const timer =
      setInterval(() => {
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
  // WEB WORKER + MEDIAPIPE
  // =========================

  useEffect(() => {
    // IMPORTANTE:
    // Worker CLÁSICO.
    //
    // NO usamos:
    //
    // {
    //   type: "module"
    // }
    //
    // porque el Worker necesita
    // utilizar importScripts().
    const worker = new Worker(
      new URL("../../workers/handLandmarker.worker.js", import.meta.url)
    );

    workerRef.current =
      worker;

    // =========================
    // RUTA WASM
    // =========================

    const wasmPath =
      new URL(
        `${import.meta.env.BASE_URL}wasm/`,
        window.location.href
      ).href;

    const mediaPipeBundlePath = new URL(
      `${import.meta.env.BASE_URL}vision_bundle.js`,
      window.location.href
    ).href;
    // =========================
    // MODELO
    // =========================

    const modelAssetPath =
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

    // =========================
    // INICIALIZAR WORKER
    // =========================
    worker.postMessage({
      type: "INIT",
      bundlePath: mediaPipeBundlePath,
      wasmPath,
      modelAssetPath,
    });

    // =========================
    // MENSAJES WORKER
    // =========================

    worker.onmessage = (event) => {
      const data = event.data;

      // DETECTOR LISTO
      if (data.type === "READY") {
        console.log("✅ Detector de manos listo en Web Worker");
        setDetectorReady(true);
        return;
      }

      // RESULTADO DE LA DETECCIÓN
      if (data.type === "RESULT") {
        workerBusyRef.current = false;

        const stats = detectionStatsRef.current;

        stats.count += 1;
        stats.processing += data.processingTime ?? 0;
        stats.capture += data.bitmapCreationTime ?? 0;
        stats.roundTrip +=
          performance.now() - (data.sentAt ?? performance.now());

        if (stats.count >= 10) {
          console.log("📊 Rendimiento MediaPipe en móvil:", {
            detecciones: stats.count,
            capturaPromedioMs: +(
              stats.capture / stats.count
            ).toFixed(1),
            procesamientoPromedioMs: +(
              stats.processing / stats.count
            ).toFixed(1),
            idaYVueltaPromedioMs: +(
              stats.roundTrip / stats.count
            ).toFixed(1),
          });

          detectionStatsRef.current = {
            count: 0,
            processing: 0,
            capture: 0,
            roundTrip: 0,
          };
        }

        if (data.finger) {
          fingerPositionRef.current = data.finger;
          setFingerDetected(true);
        } else {
          fingerPositionRef.current = null;
          setFingerDetected(false);
        }

        return;
      }

      // ERROR DEL WORKER
      if (data.type === "ERROR") {
        workerBusyRef.current = false;
        console.error("❌ MediaPipe Worker:", data.message);
      }
    };
    // =========================
    // ERROR DEL WORKER
    // =========================

    worker.onerror = (error) => {
      workerBusyRef.current =
        false;

      console.error(
        "❌ Error del Web Worker:",
        error
      );
    };

    // =========================
    // LIMPIEZA
    // =========================

    return () => {
      worker.postMessage({
        type: "CLOSE",
      });

      worker.terminate();

      workerRef.current =
        null;

      workerBusyRef.current =
        false;
    };
  }, []);

  // =========================
  // CÁMARA
  // =========================

  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 640,
                  max: 640,
                },

                height: {
                  ideal: 480,
                  max: 480,
                },

                frameRate: {
                  ideal: 30,
                  max: 30,
                },
              },

              audio: false,
            }
          );

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch(() => { });
        }
      } catch (error) {
        console.error(
          "❌ Error al acceder a la cámara:",
          error
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, []);

  // =========================
  // DETECTAR MANO
  // =========================

  useEffect(() => {
    let animationFrame;

    let lastDetectionTime =
      0;

    const detectionInterval =
      42;

    async function detectHand(
      timestamp
    ) {
      if (
        !videoRef.current ||
        !workerRef.current ||
        !detectorReady ||
        gameOverRef.current
      ) {
        animationFrame =
          requestAnimationFrame(
            detectHand
          );

        return;
      }

      // =======================
      // ~24 FPS
      // =======================

      if (
        timestamp -
        lastDetectionTime >=
        detectionInterval
      ) {
        lastDetectionTime =
          timestamp;

        // =====================
        // NO CREAR COLA
        // =====================

        if (
          !workerBusyRef.current &&
          videoRef.current
            .readyState >= 2
        ) {
          workerBusyRef.current =
            true;

          try {


            const captureStartedAt = performance.now();

            const bitmap = await createImageBitmap(
              videoRef.current,
              {
                resizeWidth: 256,
                resizeHeight: 192,
                resizeQuality: "low",
              }
            );

            const bitmapCreationTime =
              performance.now() - captureStartedAt;

            workerRef.current.postMessage(
              {
                type: "DETECT",
                bitmap,
                timestamp: performance.now(),
                sentAt: performance.now(),
                bitmapCreationTime,
              },
              [bitmap]
            );
          } catch (error) {
            workerBusyRef.current =
              false;

            console.warn(
              "No se pudo crear ImageBitmap:",
              error
            );
          }
        }
      }

      animationFrame =
        requestAnimationFrame(
          detectHand
        );
    }

    animationFrame =
      requestAnimationFrame(
        detectHand
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [detectorReady]);

  // =========================
  // GENERAR POSICIÓN OBJETIVO
  // =========================

  function generateNewTargetPosition(
    currentTarget
  ) {
    let newX;
    let newY;

    let validPosition =
      false;

    let attempts = 0;

    while (
      !validPosition &&
      attempts < 100
    ) {
      attempts++;

      newX =
        Math.random() * 70 + 15;

      newY =
        Math.random() * 55 + 22;

      validPosition =
        true;

      for (
        const target of
        targetsRef.current
      ) {
        if (
          target.id ===
          currentTarget.id
        ) {
          continue;
        }

        const distance =
          Math.sqrt(
            Math.pow(
              newX -
              target.x,
              2
            ) +
            Math.pow(
              newY -
              target.y,
              2
            )
          );

        if (
          distance < 14
        ) {
          validPosition =
            false;

          break;
        }
      }

      const currentDuck =
        duckStateRef.current;

      const distanceToDuck =
        Math.sqrt(
          Math.pow(
            newX -
            currentDuck.x,
            2
          ) +
          Math.pow(
            newY -
            currentDuck.y,
            2
          )
        );

      if (
        distanceToDuck < 15
      ) {
        validPosition =
          false;
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
    if (
      gameOverRef.current
    ) {
      return;
    }

    playTargetSound();

    setScore(
      (previousScore) =>
        previousScore + 1
    );

    const newPosition =
      generateNewTargetPosition(
        target
      );

    const updatedTargets =
      targetsRef.current.map(
        (currentTarget) =>
          currentTarget.id ===
            target.id
            ? {
              ...currentTarget,
              x: newPosition.x,
              y: newPosition.y,
            }
            : currentTarget
      );

    targetsRef.current =
      updatedTargets;

    setTargets(
      updatedTargets
    );
  }

  // =========================
  // PERDER
  // =========================

  function loseGame() {
    if (
      gameOverRef.current
    ) {
      return;
    }

    gameOverRef.current =
      true;

    console.log(
      "💀 TOCASTE AL PATO"
    );

    setGameOver(true);

    playGameOverSounds();
  }

  // =========================
  // LOOP DEL JUEGO
  // =========================

  useEffect(() => {
    let animationFrame;

    let lastFrameTime =
      0;

    function gameLoop(
      timestamp
    ) {
      const deltaTime =
        lastFrameTime === 0
          ? 16.67
          : timestamp -
          lastFrameTime;

      lastFrameTime =
        timestamp;

      const cappedDelta =
        Math.min(
          deltaTime,
          50
        );

      if (
        !gameOverRef.current
      ) {
        // =======================
        // PATO
        // =======================

        const currentDuck =
          duckStateRef.current;

        const speed =
          2.0 +
          Math.floor(
            gameTimeRef.current /
            5
          ) *
          0.25;

        const finalSpeed =
          Math.min(
            speed,
            4.0
          );

        const movement =
          finalSpeed *
          (cappedDelta / 50);

        let newX =
          currentDuck.x +
          currentDuck.directionX *
          movement;

        let newY =
          currentDuck.y +
          currentDuck.directionY *
          movement;

        let newDirectionX =
          currentDuck.directionX;

        let newDirectionY =
          currentDuck.directionY;

        if (newX >= 85) {
          newX = 85;

          newDirectionX =
            -1;
        }

        if (newX <= 15) {
          newX = 15;

          newDirectionX =
            1;
        }

        if (newY >= 80) {
          newY = 80;

          newDirectionY =
            -1;
        }

        if (newY <= 20) {
          newY = 20;

          newDirectionY =
            1;
        }

        const newDuck = {
          x: newX,
          y: newY,
          directionX:
            newDirectionX,
          directionY:
            newDirectionY,
        };

        duckStateRef.current =
          newDuck;

        if (
          duckRef.current
        ) {
          duckRef.current.style.left =
            `${newX}%`;

          duckRef.current.style.top =
            `${newY}%`;
        }

        // =======================
        // DEDO
        // =======================

        const finger =
          fingerPositionRef.current;

        if (finger) {
          const fingerX =
            100 -
            finger.x * 100;

          const fingerY =
            finger.y * 100;

          // =====================
          // PUNTERO
          // =====================

          if (
            fingerPointerRef.current
          ) {
            fingerPointerRef.current.style.left =
              `${fingerX}%`;

            fingerPointerRef.current.style.top =
              `${fingerY}%`;
          }

          // =====================
          // OBJETIVOS
          // =====================

          const currentTargets =
            targetsRef.current;

          for (
            const target of
            currentTargets
          ) {
            const distanceToTarget =
              Math.sqrt(
                Math.pow(
                  fingerX -
                  target.x,
                  2
                ) +
                Math.pow(
                  fingerY -
                  target.y,
                  2
                )
              );

            if (
              distanceToTarget < 8
            ) {
              hitTarget(target);

              break;
            }
          }

          // =====================
          // PATO
          // =====================

          const distanceToDuck =
            Math.sqrt(
              Math.pow(
                fingerX -
                newX,
                2
              ) +
              Math.pow(
                fingerY -
                newY,
                2
              )
            );

          if (
            distanceToDuck < 15
          ) {
            loseGame();
          }
        }
      }

      animationFrame =
        requestAnimationFrame(
          gameLoop
        );
    }

    animationFrame =
      requestAnimationFrame(
        gameLoop
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, []);

  // =========================
  // INTERFAZ
  // =========================

  return (
    <div className="game">

      {/* CÁMARA */}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera"
      />

      {/* OBJETIVOS */}

      {targets.map(
        (target) => (
          <Target
            key={target.id}
            x={target.x}
            y={target.y}
            onHit={() =>
              hitTarget(
                target
              )
            }
          />
        )
      )}

      {/* PATO */}

      <Duck
        ref={duckRef}
        x={duck.x}
        y={duck.y}
        direction={
          duck.directionX
        }
      />

      {/* PUNTERO */}

      <div
        ref={
          fingerPointerRef
        }
        className="finger-pointer"
        style={{
          display:
            fingerDetected
              ? "block"
              : "none",

          left: "50%",

          top: "50%",
        }}
      >
        👆
      </div>

      {/* HUD */}

      <div className="game-ui">

        <h1>
          🦆 SI TOCAS AL PATO
          ERES GAY
        </h1>

        <div className="score">
          🎯 {score}
        </div>

        <div className="status">
          {detectorReady
            ? fingerDetected
              ? "🟢 ¡TOCA LOS OBJETIVOS!"
              : "🟡 Muestra tu mano"
            : "🔵 Cargando detector..."}
        </div>

      </div>

      {/* GAME OVER */}

      {gameOver && (
        <div className="game-over screen-flash">

          <div className="game-over-box">

            <h2>
              ¡AYY, SEVERA LOCA!
            </h2>

            <p>
              ¡TOCASTE AL PATO!
            </p>

            <div className="final-score">
              PUNTAJE: {score}
            </div>

            <div className="crazy-gif">
              <img
                src={`${import.meta.env.BASE_URL}loca.gif`}
                alt="Loca"
              />
            </div>

            <button
              className="restart-button"
              onClick={
                restartGame
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