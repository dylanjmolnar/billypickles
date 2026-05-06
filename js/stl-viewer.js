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
const downloadContainer = document.getElementById('download-container');

let currentModel = null;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = null; // Transparent background

  // Initial dimensions check with fallbacks for mobile timing
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || 400;

  // Camera setup
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 150);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  
  // Mobile fix: ensure the canvas doesn't capture scroll events and fills container
  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  
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
  
  // Robust resize handling for mobile layout settlement
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      onWindowResize();
    });
    resizeObserver.observe(container);
  }
  
  // Force a resize check after a short delay for mobile layout settlement
  setTimeout(onWindowResize, 200);

  // Populate model list
  populateModelList();

  // Load initial model
  loadModel(models[0]);

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
      loadModel(model);
    };
    modelList.appendChild(btn);
  });
}

function updateDownloadButton() {
  if (!downloadContainer || !currentModel) return;
  
  downloadContainer.innerHTML = '';
  const downloadBtn = document.createElement('a');
  downloadBtn.href = `../models/${currentModel.file}`;
  downloadBtn.download = currentModel.file;
  downloadBtn.className = 'download-btn micro-animate gradient-bg';
  downloadBtn.innerHTML = `<i data-lucide="download" size="18"></i> Download STL`;
  
  downloadContainer.appendChild(downloadBtn);
  
  // Re-run lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function loadModel(model) {
  currentModel = model;
  const fileName = model.file;
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
    updateDownloadButton();
  }, undefined, (error) => {
    console.error(error);
    loadingOverlay.innerHTML = '<p>Error loading model</p>';
  });
}

function onWindowResize() {
  if (!container || !camera || !renderer) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  if (width === 0 || height === 0) {
    // Fallback if container is not yet rendered or has 0 size
    const fallbackWidth = window.innerWidth > 768 ? width : window.innerWidth - 40;
    const fallbackHeight = window.innerWidth > 768 ? height : 400;
    
    if (fallbackWidth > 0 && fallbackHeight > 0) {
      camera.aspect = fallbackWidth / fallbackHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(fallbackWidth, fallbackHeight);
    }
    return;
  }
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();
