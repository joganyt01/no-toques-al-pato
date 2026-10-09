let FilesetResolver = null;
let HandLandmarker = null;
let handLandmarker = null;
let mediaPipeLoaded = false;

async function loadMediaPipe(bundlePath) {
  if (mediaPipeLoaded) {
    return;
  }

  console.log("📦 Worker: cargando bundle MediaPipe...");
  console.log("📦 Bundle:", bundlePath);

  /*
   * vision_bundle.cjs es CommonJS.
   *
   * Como este Worker es clásico, no existe `module` ni `exports`
   * automáticamente. Los creamos antes de ejecutar el bundle.
   */
  self.module = {
    exports: {},
  };

  self.exports = self.module.exports;

  importScripts(bundlePath);

  const mediaPipe = self.module.exports;

  if (!mediaPipe) {
    throw new Error(
      "El bundle MediaPipe no devolvió exports"
    );
  }

  FilesetResolver = mediaPipe.FilesetResolver;
  HandLandmarker = mediaPipe.HandLandmarker;

  if (!FilesetResolver) {
    throw new Error(
      "FilesetResolver no está disponible en el bundle MediaPipe"
    );
  }

  if (!HandLandmarker) {
    throw new Error(
      "HandLandmarker no está disponible en el bundle MediaPipe"
    );
  }

  mediaPipeLoaded = true;

  console.log(
    "✅ Worker: bundle MediaPipe cargado"
  );

  console.log(
    "✅ Worker: FilesetResolver disponible"
  );

  console.log(
    "✅ Worker: HandLandmarker disponible"
  );
}

self.onmessage = async (event) => {
  const {
    type,
    bundlePath,
    wasmPath,
    modelAssetPath,
  } = event.data;

  if (type === "INIT") {
    try {
      console.log(
        "🧠 Worker: iniciando MediaPipe..."
      );

      console.log(
        "📦 WASM:",
        wasmPath
      );

      console.log(
        "📦 Modelo:",
        modelAssetPath
      );

      await loadMediaPipe(bundlePath);

      console.log(
        "📦 Worker: creando FilesetResolver..."
      );

      const vision =
        await FilesetResolver.forVisionTasks(
          wasmPath
        );

      console.log(
        "✅ Worker: FilesetResolver creado"
      );

      console.log(
        "📦 Worker: creando HandLandmarker..."
      );

      handLandmarker =
        await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath,
              delegate: "CPU",
            },

            runningMode: "VIDEO",

            numHands: 1,
          }
        );

      console.log(
        "✅ Worker: HandLandmarker creado"
      );

      self.postMessage({
        type: "READY",
      });
    } catch (error) {
      console.error(
        "❌ Worker: error inicializando MediaPipe:",
        error
      );

      self.postMessage({
        type: "ERROR",
        message:
          error?.message ||
          String(error),
      });
    }

    return;
  }

  if (type === "DETECT") {
    const {
      bitmap,
      timestamp,
    } = event.data;

    if (!handLandmarker) {
      if (bitmap) {
        bitmap.close();
      }

      self.postMessage({
        type: "ERROR",
        message:
          "HandLandmarker todavía no está listo",
      });

      return;
    }

    try {
      const results =
        handLandmarker.detectForVideo(
          bitmap,
          timestamp
        );

      let finger = null;

      if (
        results.landmarks &&
        results.landmarks.length > 0
      ) {
        const indexFinger =
          results.landmarks[0][8];

        finger = {
          x: indexFinger.x,
          y: indexFinger.y,
        };
      }

      self.postMessage({
        type: "RESULT",
        finger,
      });
    } catch (error) {
      console.error(
        "❌ Worker: error detectando mano:",
        error
      );

      self.postMessage({
        type: "ERROR",
        message:
          error?.message ||
          String(error),
      });
    } finally {
      if (bitmap) {
        bitmap.close();
      }
    }
  }
};