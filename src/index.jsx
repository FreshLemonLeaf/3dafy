import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

// 3D Box with image texture on front/back, color on sides
function ExtrudedImageBox({
  image,
  extrusion = 0.2,
  sideColor = "#2196f3",
  backMode = "image" // "image" or "color"
}) {
  const texture = useRef();
  const mesh = useRef();

  // Load texture from image URL
  React.useEffect(() => {
    if (!image) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      image,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        texture.current = tex;
      },
      undefined,
      () => {}
    );
  }, [image]);

  // Create materials: [right, left, top, bottom, front, back]
  const materials = React.useMemo(() => {
    const colorMat = new THREE.MeshStandardMaterial({ color: sideColor });
    const frontMat = texture.current
      ? new THREE.MeshStandardMaterial({ map: texture.current })
      : new THREE.MeshStandardMaterial({ color: "#fff" });

    const backMat =
      backMode === "image" && texture.current
        ? new THREE.MeshStandardMaterial({ map: texture.current })
        : new THREE.MeshStandardMaterial({ color: sideColor });

    return [
      colorMat, // right
      colorMat, // left
      colorMat, // top
      colorMat, // bottom
      frontMat, // front
      backMat // back
    ];
  }, [texture.current, sideColor, backMode]);

  // Animate rotation for preview
  useFrame(() => {
    if (mesh.current) mesh.current.rotation.y += 0.003;
  });

  return (
    <mesh ref={mesh} material={materials}>
      <boxGeometry args={[1, 1, extrusion]} />
    </mesh>
  );
}

function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [extrusion, setExtrusion] = useState(0.2);
  const [sideColor, setSideColor] = useState("#2196f3");
  const [backMode, setBackMode] = useState("image");

  // Handler for file upload
  function handleFile(e) {
    const file = e.target.files[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  }

  // Download 3D model as GLB
  function handleDownload() {
    const scene = new THREE.Scene();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, extrusion),
      [
        new THREE.MeshStandardMaterial({ color: sideColor }),
        new THREE.MeshStandardMaterial({ color: sideColor }),
        new THREE.MeshStandardMaterial({ color: sideColor }),
        new THREE.MeshStandardMaterial({ color: sideColor }),
        new THREE.MeshStandardMaterial({
          map: imageUrl
            ? new THREE.TextureLoader().load(imageUrl)
            : null,
          color: imageUrl ? "#fff" : "#fff"
        }),
        backMode === "image"
          ? new THREE.MeshStandardMaterial({
              map: imageUrl
                ? new THREE.TextureLoader().load(imageUrl)
                : null,
              color: imageUrl ? "#fff" : "#fff"
            })
          : new THREE.MeshStandardMaterial({ color: sideColor })
      ]
    );
    scene.add(box);
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      function (gltf) {
        const blob = new Blob([gltf instanceof ArrayBuffer ? gltf : JSON.stringify(gltf)], {
          type: "application/octet-stream"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "extruded-image.glb";
        a.click();
      },
      { binary: true }
    );
  }

  return (
    <div>
      <div className="controls">
        <label>
          Upload image:
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>{" "}
        <label>
          Extrusion depth:
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            value={extrusion}
            onChange={(e) => setExtrusion(Number(e.target.value))}
          />
          {extrusion.toFixed(2)}
        </label>{" "}
        <label>
          Side/Back color:
          <input
            type="color"
            value={sideColor}
            onChange={(e) => setSideColor(e.target.value)}
          />
        </label>{" "}
        <label>
          Back face:
          <select value={backMode} onChange={(e) => setBackMode(e.target.value)}>
            <option value="image">Same as front</option>
            <option value="color">Solid color</option>
          </select>
        </label>{" "}
        <button onClick={handleDownload} disabled={!imageUrl}>
          Download 3D Model
        </button>
      </div>
      <div className="canvas-container">
        <Canvas camera={{ position: [1.5, 1.5, 2] }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          {imageUrl && (
            <ExtrudedImageBox
              image={imageUrl}
              extrusion={extrusion}
              sideColor={sideColor}
              backMode={backMode}
            />
          )}
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
