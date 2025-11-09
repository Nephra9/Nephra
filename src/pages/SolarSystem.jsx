import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const Planet = React.memo(function Planet({
  name,
  textureUrl,
  radius,
  distance,
  revolutionSpeed,
  rotationSpeed,
  tilt,
  hasRing,
  startAngle,
  paused,
  offsetTime,
  onHoverEnter,
  onHoverLeave,
}) {
  const planetRef = useRef();
  const orbitRef = useRef();
  const texture = useMemo(() => new THREE.TextureLoader().load(textureUrl), [textureUrl]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() - offsetTime.current;
    if (!paused) {
      orbitRef.current.rotation.y = t * revolutionSpeed + startAngle;
      planetRef.current.rotation.y = t * rotationSpeed;
    }
  });

  return (
    <group ref={orbitRef}>
      {/* Orbit Path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.03, distance + 0.03, 128]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Planet */}
      <mesh
        ref={planetRef}
        position={[distance, 0, 0]}
        rotation={[tilt, 0, 0]}
        onPointerOver={() => onHoverEnter(name)}
        onPointerOut={onHoverLeave}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Saturn Ring */}
      {hasRing && (
        <mesh rotation={[Math.PI / 2, Math.PI / 6, 0]} position={[distance, 0, 0]}>
          <ringGeometry args={[radius * 1.8, radius * 2.8, 128]} />
          <meshBasicMaterial
            map={new THREE.TextureLoader().load("/textures/saturn_ring.png")}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      )}
    </group>
  );
});

function SolarSystem({ onPlanetHover }) {
  const [paused, setPaused] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const offsetTime = useRef(0);
  const pauseStart = useRef(0);
  const labelPos = useRef([0, 0, 0]);

  const handleHoverEnter = useCallback((planetName) => {
    setHoveredPlanet(planetName);
    setPaused(true);
    pauseStart.current = performance.now() / 1000;
    if (onPlanetHover) onPlanetHover(planetName);
  }, [onPlanetHover]);

  const handleHoverLeave = useCallback(() => {
    setHoveredPlanet(null);
    setPaused(false);
    const resume = performance.now() / 1000;
    offsetTime.current += resume - pauseStart.current;
    if (onPlanetHover) onPlanetHover("Nephra");
  }, [onPlanetHover]);

  const startAngles = [
    0,
    Math.PI / 3,
    Math.PI / 2,
    Math.PI / 1.3,
    Math.PI / 1,
    Math.PI / 7,
    Math.PI / 2,
    Math.PI / 1.2,
    Math.PI / 2.5,
  ];
  const outerSpeed = 0.05;

  const planets = [
    ["MR.Mercury", 0.7, 4, "/textures/mercury.jpg", 0.6, 0.8, 0.03],
    ["MR.Venus", 1.0, 7, "/textures/venus.jpg", 0.4, -0.4, 3.09],
    ["MR.Earth", 1.2, 10, "/textures/earth.jpg", 0.3, 1.2, 0.41],
    ["MR.Mars", 1.0, 13, "/textures/mars.jpg", 0.24, 1, 0.44],
    ["MR.Jupiter", 2.3, 18, "/textures/jupiter.jpg", outerSpeed * 1.0, 1.8, 0.05],
    ["MR.Saturn", 2.0, 22, "/textures/saturn.jpg", outerSpeed * 0.95, 1.5, 0.46, true],
    ["MR.Uranus", 1.7, 26, "/textures/uranus.jpg", outerSpeed * 0.9, 1.2, 1.7],
    ["MR.Neptune", 1.6, 30, "/textures/neptune.jpg", outerSpeed * 0.85, 1.0, 0.49],
    ["MR.Pluto", 0.6, 34, "/textures/pluto.jpg", outerSpeed * 0.8, 0.8, 0.15],
  ];

  return (
    <Canvas camera={{ position: [0, 60, 0], fov: 65 }} style={{ backgroundColor: "black", width: "55rem" }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={3} />

      {/* Sun */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial emissive={"#ffb84d"} emissiveIntensity={2} color={"#ffaa00"} />
      </mesh>

      {/* Planets */}
      {planets.map(([name, r, d, tex, rev, rot, tilt, ring], i) => (
        <Planet
          key={name}
          name={name}
          radius={r}
          distance={d}
          textureUrl={tex}
          revolutionSpeed={rev}
          rotationSpeed={rot}
          tilt={tilt}
          hasRing={ring}
          startAngle={startAngles[i]}
          paused={paused}
          offsetTime={offsetTime}
          onHoverEnter={handleHoverEnter}
          onHoverLeave={handleHoverLeave}
        />
      ))}

      {/* Single Hover Label */}
      {hoveredPlanet && (
        <Html position={[0, 0, 0]} distanceFactor={14}>
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              padding: "6px 10px",
              borderRadius: "6px",
              color: "white",
              fontSize: "14px",
              pointerEvents: "none",
              transition: "opacity 0.2s ease",
            }}
          >
            {hoveredPlanet}
          </div>
        </Html>
      )}

      <Stars radius={300} depth={60} count={8000} factor={4} fade />
      <OrbitControls enableZoom={true} enableRotate={false} enablePan={false}  />
    </Canvas>
  );
}

export default React.memo(SolarSystem);
