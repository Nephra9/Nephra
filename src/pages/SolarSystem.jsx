import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function FresnelGlow({ scale = 1.3, color = "#ff3300" }) {
  const shaderRef = useRef();

  const shader = {
    uniforms: {
      color: { value: new THREE.Color(color) }
    },
    vertexShader: `
      varying float vIntensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vPositionNormal = normalize(-normalize(modelViewMatrix * vec4(position, 1.0)).xyz);
        vIntensity = pow(1.0 - dot(vNormal, vPositionNormal), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vIntensity;
      void main() {
        gl_FragColor = vec4(color * vIntensity, vIntensity);
      }
    `
  };

  return (
    <mesh scale={scale} ref={shaderRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        attach="material"
        args={[shader]}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function SolarCorona() {
  return (
    <mesh scale={3}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial
        color="#ff7700"
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function SuperRedGiantSurface() {
  const matRef = useRef();

  useFrame(({ clock }) => {
    matRef.current.uniforms.time.value = clock.getElapsedTime() * 1.5;
  });

  const shader = {
    uniforms: { time: { value: 0 } },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f*f*(3.0 - 2.0*f);

        return mix(
          mix(
            mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
            f.y
          ),
          mix(
            mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p) {
        float f = 0.0;
        f += noise(p) * 0.6;
        f += noise(p * 2.0) * 0.3;
        f += noise(p * 4.0) * 0.15;
        f += noise(p * 8.0) * 0.05;
        return f;
      }

      float limbDarkening(vec3 n) {
        float d = dot(n, vec3(0,0,1));
        return smoothstep(-1.0, 1.0, d);
      }

      void main() {
        vec3 p = normalize(vNormal) * 3.5;

        float n = fbm(p + time * 1.2);
        float turbulence = fbm(p * 2.5 + time * 2.5);

        float cracks = smoothstep(0.6, 1.0, n + turbulence * 0.5);

        vec3 color = mix(
          vec3(0.8, 0.05, 0.0),
          vec3(1.0, 0.15, 0.0),
          n
        );

        color = mix(color, vec3(1.0, 0.3, 0.0), cracks * 1.8);

        color += fbm(p * 4.0 + time * 3.0) * 0.35;

        float radial = length(vPosition) / 2.0;
        color += (1.0 - radial) * 0.4;

        color *= limbDarkening(vNormal);

        gl_FragColor = vec4(color, 1.0);
      }
    `
  };

  return (
    <mesh>
      <sphereGeometry args={[2, 128, 128]} />
      <shaderMaterial ref={matRef} args={[shader]} />
    </mesh>
  );
}

function ProminenceArcs() {
  const group = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 0.15;
  });

  const arcs = [...Array(4)].map((_, i) => (
    <mesh key={i} rotation={[Math.PI / 2, 0, (Math.PI / 2) * i]} scale={[1, 1, 0.15]}>
      <torusGeometry args={[3.0, 0.15, 32, 128]} />
      <meshBasicMaterial
        color="#ff3300"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  ));

  return <group ref={group}>{arcs}</group>;
}
function ShockwaveRipples() {
  const rippleRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 1.0 + Math.sin(t * 3) * 0.1;
    rippleRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={rippleRef} scale={1.1}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial
        color="#ff5522"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function PlasmaParticles() {
  const particles = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.current.rotation.y = t * 0.3;
  });

  const positions = new Float32Array(
    [...Array(500)].flatMap(() => {
      const r = 2.3 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ];
    })
  );

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff5500"
        size={0.06}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MagneticFieldLoops() {
  const group = useRef();

  useFrame(({ clock }) => {
    group.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.8) * 0.4;
    group.current.rotation.y = clock.getElapsedTime() * 0.2;
  });

  return (
    <group ref={group}>
      <mesh>
        <torusGeometry args={[2.6, 0.05, 16, 200]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[2.6, 0.05, 16, 200]} />
        <meshBasicMaterial
          color="#ff2200"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}




// -------------------------------------------------------
// 🪐 PLANET COMPONENT
// -------------------------------------------------------
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
      {/* Orbit ring */}
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

      {/* Saturn ring */}
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


// -------------------------------------------------------
// 🌌 MAIN SOLAR SYSTEM
// -------------------------------------------------------
function SolarSystem({ onPlanetHover }) {
  const [paused, setPaused] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const offsetTime = useRef(0);
  const pauseStart = useRef(0);

  const handleHoverEnter = useCallback((planetName) => {
    setHoveredPlanet(planetName);
    setPaused(true);
    pauseStart.current = performance.now() / 1000;
    if (onPlanetHover) onPlanetHover(planetName);
  }, []);

  const handleHoverLeave = useCallback(() => {
    setHoveredPlanet(null);
    setPaused(false);
    const resume = performance.now() / 1000;
    offsetTime.current += resume - pauseStart.current;
    if (onPlanetHover) onPlanetHover("Nephra");
  }, []);


  // Planet definitions
  const startAngles = [
    0, Math.PI / 3, Math.PI / 2, Math.PI / 1.3, Math.PI / 1,
    Math.PI / 7, Math.PI / 2, Math.PI / 1.2, Math.PI / 2.5,
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
      <pointLight position={[0, 0, 0]} intensity={5} />

      {/* 🌋 SUPERPOWERED RED GIANT SUN */}
      <SuperRedGiantSurface />
      {/* <FresnelGlow scale={1.35} color="#ff2200" /> */}
      {/* <SolarCorona /> */}

      {/* <ProminenceArcs /> */}
      {/* <ShockwaveRipples /> */}
      {/* <PlasmaParticles /> */}
      {/* <MagneticFieldLoops /> */}


      {/* 🪐 Planets */}
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

      {/* Planet label */}
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
            }}
          >
            {hoveredPlanet}
          </div>
        </Html>
      )}

      <Stars radius={300} depth={60} count={8000} factor={4} fade />
      <OrbitControls enableZoom enableRotate={false} enablePan={false} />
    </Canvas>
  );
}

export default React.memo(SolarSystem);
