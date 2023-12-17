import { ArcRotateCamera, FreeCamera } from '@babylonjs/core/Cameras';
import { createNoise2D } from 'simplex-noise';
import { SkyMaterial, FurMaterial } from '@babylonjs/materials'
import { 
  WebGPUEngine, ShadowGenerator, SimplificationType, 
  PointLight, PBRMaterial, SceneLoader, Engine, 
  MeshBuilder, HavokPlugin, Texture, PhysicsAggregate, 
  Color3, Mesh, PhysicsShapeType } from '@babylonjs/core';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import HavokPhysics from "@babylonjs/havok";
import Grass from './grass';
import { DynamicTerrain } from './dynamicTerrain';
import dungeoneer from 'dungeoneer'
import { Scene } from '@babylonjs/core/scene';
import CharacterController from './CharacterController';
import DungeonGenerator from './DungeonGenerator';
import { OBJFileLoader, GLTFFileLoader } from 'babylonjs-loaders';

import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { reverse } from 'dns';

SceneLoader.RegisterPlugin(new OBJFileLoader() as any)
SceneLoader.RegisterPlugin(new GLTFFileLoader() as any)

const MAP_SIZE = 10;

// Get the canvas element from the DOM.
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

canvas.onclick = () => canvas.requestPointerLock()

const noise2D = createNoise2D();

async function createEngine() {
  if (await WebGPUEngine.IsSupportedAsync) {
    const engine = new WebGPUEngine(canvas);

    await engine.initAsync()

    return engine;
  }

  return new Engine(canvas)
}

// Associate a Babylon Engine to it.
const engine = await createEngine()
// await engine.initAsync();


window.electron.send('getPhysicEngine');


const havokInstance = await new Promise(resolve => {
  window.electron.on('returnPhysicEngine', async (_, binary) => resolve(await HavokPhysics({ wasmBinary: binary})))
})


// Create our first scene.
const scene = new Scene(engine);

scene.useRightHandedSystem = true;
scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havokInstance));

// // This targets the camera to scene origin
// camera.setTarget(Vector3.Zero());

// // This attaches the camera to the canvas
// camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
// const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

// // Default intensity is 1. Let's dim the light a small amount
// light.intensity = 0;
// light.intensity = 1;


// const box = Mesh.CreateBox('character', 12, scene);

// box.checkCollisions = true



// camera.lockedTarget = box

// const ground = MeshBuilder.CreateGround("ground", { height: 1000, width: 1000 }, scene);

// const rockMaterial = new StandardMaterial("rock", scene);

// rockMaterial.diffuseTexture = new Texture('/rock.png', scene);
// rockMaterial.bumpTexture = new Texture('/rock_normal.png', scene);
// rockMaterial.diffuseTexture.uScale = 3.0;
// rockMaterial.diffuseTexture.vScale = 3.0;
// rockMaterial.bumpTexture.uScale = 3.0;
// rockMaterial.bumpTexture.vScale = 3.0;
// rockMaterial.useParallax = true;
// rockMaterial.useParallaxOcclusion = true;
// rockMaterial.parallaxScaleBias = 0.1;
// rockMaterial.specularPower = 1000.0;
// rockMaterial.specularColor = new Color3(0.5, 0.5, 0.5);

await SceneLoader.ImportMeshAsync('', '/', 'torch.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'barrel.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'web.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'pillar.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'bone.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'cage.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'rack.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'skeleton.glb', scene);
await SceneLoader.ImportMeshAsync('', '/', 'arch.glb', scene);

const wallMaterial = new PBRMaterial("wall", scene);
wallMaterial.albedoTexture = new Texture('/wall.png', scene);
wallMaterial.metallicTexture = new Texture('/Floor_metallicRoughness.png', scene);
wallMaterial.bumpTexture = new Texture('/Floor_normal.png', scene)
wallMaterial.ambientTexture = new Texture('/wall_ao.png', scene);
// wallMaterial.lightmapTexture = new Texture('/lightmap.png', scene);
wallMaterial.useRoughnessFromMetallicTextureAlpha = false;
wallMaterial.useRoughnessFromMetallicTextureGreen = true;
wallMaterial.useMetallnessFromMetallicTextureBlue = true;
wallMaterial.albedoTexture.uScale = 1.0;
wallMaterial.albedoTexture.vScale = 1.0;
wallMaterial.metallicTexture.uScale = 1.0
wallMaterial.metallicTexture.vScale = 1.0
wallMaterial.bumpTexture.uScale = 1.0;
wallMaterial.bumpTexture.vScale = 1.0;
wallMaterial.useParallax = true;
wallMaterial.useParallaxOcclusion = true;
wallMaterial.parallaxScaleBias = 0.2;
wallMaterial.specularPower = 1000.0;
wallMaterial.specularColor = new Color3(0.5, 0.5, 0.5);

const wall = MeshBuilder.CreateBox('box', { size: MAP_SIZE }, scene)
// wall.material = wallMaterial;
// wall.checkCollisions = true;

const floor = MeshBuilder.CreateBox('box', { height: MAP_SIZE, width: MAP_SIZE }, scene);
// floor.material = wallMaterial;
// floor.checkCollisions = true;

// ground.checkCollisions = true
// ground.material = rockMaterial
// ground.applyDisplacementMap('parquet_displacement.jpg', 1, 1)

const torchLight = new PointLight("torchLight", new Vector3(0, 1, 0), scene);
torchLight.intensity = 1000;
torchLight.diffuse = new Color3(1, 0.3, 0.05)


const shadows = new ShadowGenerator(1024, torchLight);
shadows.useExponentialShadowMap = true

floor.material = wallMaterial;
floor.material.maxSimultaneousLights = 12;
floor.checkCollisions = true;
floor.receiveShadows = true;
// shadows.addShadowCaster(floor)

wall.material = wallMaterial;
wall.material.maxSimultaneousLights = 12;
wall.checkCollisions = true;
wall.receiveShadows = true;
// shadows.addShadowCaster(wall)

const torch = scene.getMeshByName('torch') as Mesh
const barrel = scene.getMeshByName('barrel') as Mesh
const pillar = scene.getMeshByName('pillar') as Mesh
const web = scene.getMeshByName('web') as Mesh
const bone  = scene.getMeshByName('bone') as Mesh
const cage = scene.getMeshByName('cage') as Mesh
const arch = scene.getMeshByName('arch') as Mesh
// const rack = Mesh.MergeMeshes([
//   scene.getMeshByName('rack_primitive1') as Mesh,
//   scene.getMeshByName('rack_primitive0') as Mesh
// ]) as Mesh
const skeleton = Mesh.MergeMeshes([
  scene.getMeshByName("skeleton_primitive0") as Mesh,
  scene.getMeshByName("skeleton_primitive1") as Mesh,
  scene.getMeshByName("skeleton_primitive2") as Mesh,
  scene.getMeshByName("skeleton_primitive3") as Mesh,
  scene.getMeshByName("skeleton_primitive4") as Mesh
]) as Mesh

console.log(scene)
// throw new Error()

cage.scaling = new Vector3(2.5, 2.5, 2.5)
cage.checkCollisions = true;
cage.receiveShadows = true;

bone.scaling = new Vector3(3, 3, 3);
bone.receiveShadows = true;
// bone.showBoundingBox = true;

barrel.checkCollisions = true;
barrel.receiveShadows = true;


web.rotation  = new Vector3(Math.PI / 2, 0, 0);
web.receiveShadows = true;
// web.showBoundingBox = true;

pillar.checkCollisions = true;
pillar.scaling = new Vector3(3.1,3.1,3.1)
pillar.position = new Vector3(0,-10,0)
pillar.receiveShadows = true

arch.checkCollisions = true;
arch.receiveShadows = true;
arch.rotation = new Vector3(-(Math.PI / 2), 0, Math.PI);

torch.scaling = new Vector3(0.02,0.02,0.02);
torch.rotation = new Vector3(0.37,0,0)
torch.receiveShadows = true;

skeleton.receiveShadows = true;
skeleton.checkCollisions = true;

// rack.simplify([
//   { distance: 100, quality: 0.8 },
//   { distance:250, quality:0.6 }, 
//   { distance:300, quality:0.5 }, 
//   { distance:400, quality:0.3 }, 
//   { distance:500, quality:0.1 }
// ], false, SimplificationType.QUADRATIC)

skeleton.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC)

bone.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC)

cage.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC)

barrel.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC);


arch.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC)

torch.simplify([
  { distance: 100, quality: 0.8 },
  { distance:250, quality:0.6 }, 
  { distance:300, quality:0.5 }, 
  { distance:400, quality:0.3 }, 
  { distance:500, quality:0.1 }
], false, SimplificationType.QUADRATIC)

const dungeonBuilder = new DungeonGenerator(20, {
  pillarMesh: pillar,
  floorMesh: floor,
  wallMesh: wall,
  archMesh: arch,
  doorMesh: floor,
  blockSize : 10,
  decorMeshes : [
    { chance: 0.5, mesh: torch, indent: 1.84, name: 'torch', yAxis: 2.5, rotateByX: -(Math.PI / 2), rotateByZ: Math.PI },
    { chance: 0.05, mesh: cage, indent: 1.65, name: 'cage', yAxis: 2, moveFromCenter: -3 },
    // { chance: 0.03, mesh: rack, indent: 1.8, name: 'rack', exclusive: true, rotateByX: -Math.PI, rotateByZ: -(Math.PI / 2) },
    { chance: 0.03, mesh: skeleton, indent: 1.8, name: 'skeleton', exclusive: true, rotateByX: -(Math.PI / 2), rotateByZ: -Math.PI },
    { chance: 0.2, mesh: barrel, indent: 1.65, name: 'barrel' },
    { chance: 0.1, mesh: bone, name: 'bone', yAxis: -4.45 },
    { chance: 0.2, mesh: web, indent: 2, name: 'web', yAxis: 3.2, moveFromCenter: 3, rotateByZ: -(Math.PI / 2) }
  ]
}, shadows, scene)


const { startPositions, wallMesh, floorMesh } = dungeonBuilder.build()


// floor.dispose()
// wall.dispose()
// torch.dispose()
// barrel.dispose()
// web.dispose()
// pillar.dispose()


// if (floorMesh) {
//   floorMesh.material = wallMaterial;
//   floorMesh.material.maxSimultaneousLights = 12;
//   floorMesh.checkCollisions = true;
//   floorMesh.receiveShadows = true;
//   shadows.addShadowCaster(floorMesh)
// }

// if (wallMesh) {
//   wallMesh.material = wallMaterial;
//   wallMesh.material.maxSimultaneousLights = 12;
//   wallMesh.checkCollisions = true;
//   wallMesh.receiveShadows = true;
//   shadows.addShadowCaster(wallMesh)
// }


if (!startPositions?.[0]) throw new Error('Position for start is not exists')

const camera = new FreeCamera('camera', startPositions[0], scene)

camera.attachControl(canvas, true)

// for (let z = 0;z < MAP_SIZE; z++) {
//   const path = [];

//   for (let x = 0; x < MAP_SIZE; x++) {

//     const noise = noise2D(x * noiseScale, z * noiseScale);
    
//     path.push(new Vector3(x - MAP_SIZE / 2, noise * noise * 10, z - MAP_SIZE / 2))
//   }

//   paths.push(path)
// }

// const terrain = MeshBuilder.CreateRibbon('terrain', { pathArray: paths, sideOrientation: 2 }, scene);

// const params2 = {
//   noiseScale: 0.02,
//   mapSubX: 400,
//   mapSubZ: 400,
//   terrainSub: 200
// };

// const terrain2 = new DynamicTerrain("terrain", params2, scene)
// const ground = new StandardMaterial("grass", scene);

new CharacterController('FPS', camera, scene, [ 'floor' ])

torchLight.parent = camera;


// new PhysicsAggregate(cube, PhysicsShapeType.BOX, { mass: 0 }, scene)

// ground.diffuseTexture = new Texture('/sameless.jpg', scene);
// ground.diffuseTexture.uScale = 20.0;
// ground.diffuseTexture.vScale = 20.0;
// ground.reflectionTexture = null

// terrain2.mesh.material = ground
// terrain2.mesh.checkCollisions = true


// new Grass(paths, 10, scene, engine)


const skyMaterial = new SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;
skyMaterial.luminance = 1
skyMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
skyMaterial.sunPosition = new Vector3(50, 50, 0);
skyMaterial.rayleigh = 2;

const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, scene);
skybox.material = skyMaterial;


window.addEventListener("resize", () => engine.resize());

scene.registerBeforeRender(() => {
    scene.meshes.forEach(mesh => {
      if (mesh?.isOccluded) mesh.getChildren()?.[0]?.setEnabled(false)
      else mesh.getChildren()?.[0]?.setEnabled(true)
    })
})

// Render every frame
engine.runRenderLoop(() => {
  scene.render();
  // console.log(engine.getFps())
});
