import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const models = [
  { id: '1', name: 'Airpods Desk Holder', file: 'airpodpro3-desk-holder.stl' },
  { id: '2', name: 'Ridge Wallet Holder', file: 'ridge-wallet-holder.stl' },
  { id: '3', name: 'AA Battery Holder', file: 'aa-battery-holder.stl' },
  { id: '4', name: 'Hybrid Battery Cap', file: 'hybrid-battery-cap.stl' },
  { id: '5', name: 'Lexus GS USBC', file: 'lexus-coin-replacement.stl' }
];

let scene, camera, renderer, controls, mesh;
const container = document.getElementById('viewer-container');
const loadingOverlay = document.getElementById('loading-overlay');
const modelList = document.getElementById('model-list');

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = null; // Transparent background

  // Camera setup
  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 150);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Controls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(100, 100, 100);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x3b82f6, 1, 500);
  pointLight.position.set(-50, -50, 50);
  scene.add(pointLight);

  // Handle resize
  window.addEventListener('resize', onWindowResize);

  // Populate model list
  populateModelList();

  // Load initial model
  loadModel(models[0].file);

  animate();
}

function populateModelList() {
  models.forEach((model, index) => {
    const btn = document.createElement('button');
    btn.className = `model-button ${index === 0 ? 'active' : ''}`;
    btn.textContent = model.name;
    btn.onclick = () => {
      document.querySelectorAll('.model-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadModel(model.file);
    };
    modelList.appendChild(btn);
  });
}

function loadModel(fileName) {
  loadingOverlay.style.display = 'flex';
  
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  // Reset view to original origin position
  if (camera) camera.position.set(0, 0, 150);
  if (controls) {
    controls.target.set(0, 0, 0);
    controls.update();
  }

  const loader = new STLLoader();
  loader.load(`../models/${fileName}`, (geometry) => {
    // Center geometry
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.8
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Scale model to fit view roughly
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 80 / maxDim;
    mesh.scale.set(scale, scale, scale);

    scene.add(mesh);
    loadingOverlay.style.display = 'none';
  }, undefined, (error) => {
    console.error(error);
    loadingOverlay.innerHTML = '<p>Error loading model</p>';
  });
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();
