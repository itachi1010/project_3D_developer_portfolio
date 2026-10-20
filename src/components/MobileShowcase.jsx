import { Component, Suspense, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Html } from '@react-three/drei';
import { useInView } from 'framer-motion';
import { Box3, Vector3, sRGBEncoding } from 'three';

const apps = {
  user: { title: 'KekeDrop', audience: 'For passengers', description: 'A clear journey from booking a keke to following a ride. Built with React Native and connected to the platform’s shared Node.js backend.', url: 'https://play.google.com/store/apps/details?id=com.kekedrop.user', icon: '/projects/kekedrop/user-icon.jpg' },
  driver: { title: 'KekeDrop Driver', audience: 'For drivers', description: 'The other side of the ride: a dedicated driver app for accepting rides, tracking earnings and managing the workday.', url: 'https://play.google.com/store/apps/details?id=com.kekedrop.rider', icon: '/projects/kekedrop/driver-icon.png' },
};

function Phone({ screenshot }) {
  const gltf = useGLTF('/models/phone/quaternius-phone.glb');
  const texture = useTexture(screenshot);
  texture.encoding = sRGBEncoding;
  const { model, width, depth } = useMemo(() => {
    const model = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    model.position.sub(center);
    const scale = 3.8 / size.y;
    model.scale.multiplyScalar(scale);
    model.position.multiplyScalar(scale);
    return { model, width: size.x * scale, depth: size.z * scale };
  }, [gltf]);
  const screenWidth = width * 0.88;
  return <group rotation={[0.045, -0.16, 0.025]}>
    <primitive object={model} />
    <mesh position={[0, 0.02, depth / 2 + 0.012]}>
      <planeGeometry args={[screenWidth, screenWidth * 1600 / 720]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  </group>;
}

class PhoneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function MobileShowcase() {
  const [kind, setKind] = useState('user');
  const [shot, setShot] = useState(1);
  const stageRef = useRef(null);
  const visible = useInView(stageRef, { once: true, margin: '200px' });
  const app = apps[kind];
  const screenshot = `/projects/kekedrop/${kind}-${shot}.png`;
  const fallback = <img src={screenshot} className='phone-fallback' alt={`${app.title} official screenshot ${shot}`} />;
  return <section className='section-shell mobile-section' id='mobile'>
    <div className='section-heading'><p className='eyebrow'>03 / MOBILE APPS, IN YOUR HANDS</p><h2>Two apps.<br />One connected ride<span className='accent-dot'>.</span></h2></div>
    <div className='mobile-showcase-grid'>
      <div className='phone-stage' ref={stageRef} aria-label={`Interactive 3D phone showing ${app.title}`}>
        <span className='stage-orbit stage-orbit-one' aria-hidden='true' /><span className='stage-orbit stage-orbit-two' aria-hidden='true' />
        <span className='stage-label'>KEKEDROP / ANDROID</span>
        {visible && <PhoneBoundary fallback={fallback}><Canvas frameloop='demand' dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 35 }} fallback={fallback}>
          <ambientLight intensity={1.3} /><directionalLight position={[3, 5, 5]} intensity={1.8} /><pointLight position={[-4, 0, 3]} intensity={0.8} color='#ac89ff' />
          <Suspense fallback={<Html center><span className='phone-loading'>Loading phone…</span></Html>}><Phone screenshot={screenshot} /></Suspense>
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2 - 0.2} maxPolarAngle={Math.PI / 2 + 0.2} minAzimuthAngle={-0.45} maxAzimuthAngle={0.45} />
        </Canvas></PhoneBoundary>}
        <span className='phone-instruction'>Drag to rotate · Select a screen below</span>
      </div>
      <div className='mobile-copy'>
        <div className='app-switcher' role='group' aria-label='Choose mobile app'>{Object.entries(apps).map(([key, item]) => <button key={key} aria-pressed={kind === key} onClick={() => { setKind(key); setShot(1); }}><img src={item.icon} alt='' /><span>{item.audience}</span></button>)}</div>
        <p className='eyebrow app-published'><span className='status-dot' /> PUBLISHED ON GOOGLE PLAY</p><h3>{app.title}</h3><p>{app.description}</p>
        <ul className='mobile-capabilities'><li>React Native mobile interfaces</li><li>Shared API and administration tools</li><li>Connected ride and payment workflows</li></ul>
        <a className='button-primary' href={app.url} target='_blank' rel='noreferrer'>View {kind === 'user' ? 'passenger' : 'driver'} app on Google Play <span aria-hidden='true'>↗</span></a>
        <div className='screenshot-picker' role='group' aria-label={`${app.title} screenshots`}>{[1, 2, 3, 4].map(index => <button aria-label={`Show ${kind} screenshot ${index}`} aria-pressed={shot === index} onClick={() => setShot(index)} key={`${kind}-${index}`}><img src={`/projects/kekedrop/${kind}-${index}.png`} alt='' loading='lazy' /></button>)}</div>
        <p className='screenshot-caption' aria-live='polite'>Official Google Play screenshot {shot} of 4 · Real app imagery on a 3D model</p>
        <a href='/credits.html' className='model-credit'>Phone model by Quaternius · CC0</a>
      </div>
    </div>
  </section>;
}
