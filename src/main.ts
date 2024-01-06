import { ArcRotateCamera, FreeCamera } from "@babylonjs/core/Cameras";
import { createNoise2D } from "simplex-noise";
import { SkyMaterial, FurMaterial } from "@babylonjs/materials";
import {
  WebGPUEngine,
  ShadowGenerator,
  SimplificationType,
  PointLight,
  PBRMaterial,
  SceneLoader,
  Engine,
  MeshBuilder,
  HavokPlugin,
  Texture,
  Tools,
  PhysicsAggregate,
  RenderTargetTexture,
  Color3,
  Mesh,
  PhysicsShapeType,
  ScenePerformancePriority,
  StandardMaterial,
} from "@babylonjs/core";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import HavokPhysics from "@babylonjs/havok";
import Grass from "./grass";
import { DynamicTerrain } from "./dynamicTerrain";
import dungeoneer from "dungeoneer";
import { Scene } from "@babylonjs/core/scene";
import CharacterController from "./CharacterController";
import DungeonGenerator from "./DungeonGenerator";
import { OBJFileLoader, GLTFFileLoader } from "babylonjs-loaders";

import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import { reverse } from "dns";
import { CubeTexture } from "../node_modules/@babylonjs/core/Materials/Textures/cubeTexture";

import { Pane } from "tweakpane";
import * as ImagePlugin from "tweakpane-image-plugin";
import { DynamicTexture } from "../node_modules/@babylonjs/core/index";

SceneLoader.RegisterPlugin(new OBJFileLoader() as any);
SceneLoader.RegisterPlugin(new GLTFFileLoader() as any);

const MAP_SIZE = 10;

// Get the canvas element from the DOM.
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

canvas.onclick = () => canvas.requestPointerLock();

const noise2D = createNoise2D();

async function createEngine() {
  if (await WebGPUEngine.IsSupportedAsync) {
    const engine = new WebGPUEngine(canvas);

    await engine.initAsync();

    return engine;
  }

  return new Engine(canvas);
}

// Associate a Babylon Engine to it.
const engine = await createEngine();
// await engine.initAsync();

window.electron.send("getPhysicEngine");

const havokInstance = await new Promise((resolve) => {
  window.electron.on("returnPhysicEngine", async (_, binary) =>
    resolve(await HavokPhysics({ wasmBinary: binary }))
  );
});

// Create our first scene.
const scene = new Scene(engine);

// scene.performancePriority = ScenePerformancePriority.Intermediate;
scene.useRightHandedSystem = true;
scene.enablePhysics(
  new Vector3(0, -9.81, 0),
  new HavokPlugin(true, havokInstance)
);

// Uncomment to load the inspector (debugging) asynchronously

void Promise.all([
  import("@babylonjs/core/Debug/debugLayer"),
  import("@babylonjs/inspector"),
]).then((_values) => {
  console.log(_values);
  scene.debugLayer.hide({
    handleResize: true,
    overlay: true,
    globalRoot: document.getElementById("#root") || undefined,
  });
});

const envTex: Texture = CubeTexture.CreateFromPrefilteredData(
  "https://assets.babylonjs.com/environments/studio.env",
  scene
);

scene.environmentTexture = envTex;
/*
scene.materials.forEach((element: any) => {
  element.environmentIntensity = 0.1;
});
*/
scene.environmentIntensity = 1;

new HemisphericLight("hemi");

//

const topDiv = document.createElement("div");
topDiv.id = "topDiv";
topDiv.style.width = "240px";
topDiv.style.minHeight = "100px";
topDiv.style.position = "absolute";
topDiv.style.top = "10px";
topDiv.style.left = "320px";
topDiv.style.background = "green";
document.body.appendChild(topDiv);

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

const exposedBrick = {
  folder: "exposed-brick-wall",
  albedo: "exposed-brick-wall_base_1k.jpg",
  metallic: "exposed-brick-wall_rough_1k.jpg",
  bump: "exposed-brick-wall_normal_1k.jpg",
  ao: "exposed-brick-wall_orm_1k.jpg",
  detail: "exposed-brick-wall_det_1k.jpg",
};

const oldStone = {
  folder: "old-stone-wall",
  albedo: "old-stone-wall_base_1k.jpg",
  metallic: "old-stone-wall_rough_1k.jpg",
  bump: "old-stone-wall_normal_1k.jpg",
  ao: "old-stone-wall_orm_1k.jpg",
  detail: "old-stone-wall_det_1k.jpg",
};

const brownCement = {
  folder: "brown-cement-concrete",
  albedo: "brown-cement-concrete_base_1k.jpg",
  metallic: "brown-cement-concrete_rough_1k.jpg",
  bump: "brown-cement-concrete_normal_1k.jpg",
  ao: "brown-cement-concrete_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const cobbleStone = {
  folder: "cobblestone-floor",
  albedo: "cobblestone-floor_base_1k.jpg",
  metallic: "cobblestone-floor_rough_1k.jpg",
  bump: "cobblestone-floor_normal_1k.jpg",
  ao: "cobblestone-floor_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};
const diamondMetal = {
  folder: "DiamondPlate008C_2K-JPG",
  albedo: "DiamondPlate008C_2K-JPG_Color.jpg",
  metallic: "DiamondPlate008C_2K-JPG_Roughness.jpg",
  bump: "DiamondPlate008C_2K-JPG_NormalDX.jpg",
  ao: "DiamondPlate008C_2K-JPG_AmbientOcclusion.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const greyWood = {
  folder: "grey-wood-plank",
  albedo: "grey-wood-plank_base_1k.jpg",
  metallic: "grey-wood-plank_rough_1k.jpg",
  bump: "grey-wood-plank_normal_1k.jpg",
  ao: "grey-wood-plank_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const whiteLeather = {
  folder: "white-leather",
  albedo: "white-leather_base_1k.jpg",
  metallic: "white-leather_rough_1k.jpg",
  bump: "white-leather_normal_1k.jpg",
  ao: "white-leather_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const oldStone2 = {
  folder: "old-stone",
  albedo: "old-stone_base_1k.jpg",
  metallic: "old-stone_rough_1k.jpg",
  bump: "old-stone_normal_1k.jpg",
  ao: "old-stone_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const darkConcrete = {
  folder: "dark-grey-concrete",
  albedo: "dark-grey-concrete_base_1k.jpg",
  metallic: "dark-grey-concrete_rough_1k.jpg",
  bump: "dark-grey-concrete_normal_1k.jpg",
  ao: "dark-grey-concrete_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const oldTiles = {
  folder: "old-tiles",
  albedo: "old-tiles_base_1k.jpg",
  metallic: "old-tiles_rough_1k.jpg",
  bump: "old-tiles_normal_1k.jpg",
  ao: "old-tiles_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};

const checkerTiles = {
  folder: "checkered-marble-flooring",
  albedo: "checkered-marble-flooring_base_1k.jpg",
  metallic: "checkered-marble-flooring_rough_1k.jpg",
  bump: "checkered-marble-flooring_normal_1k.jpg",
  ao: "checkered-marble-flooring_orm_1k.jpg",
  // detail: "old-stone-wall_det_1k.jpg",
};
//

const texArray = [
  exposedBrick,
  oldStone,
  brownCement,
  cobbleStone,
  diamondMetal,
  greyWood,
  whiteLeather,
  oldStone2,
  darkConcrete,
  oldTiles,
  checkerTiles,
];
//
//
await SceneLoader.ImportMeshAsync("", "/", "torch.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "barrel.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "web.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "pillar.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "bone.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "cage.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "rack.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "skeleton.glb", scene);
await SceneLoader.ImportMeshAsync("", "/", "arch.glb", scene);

await SceneLoader.ImportMeshAsync(
  "",
  "/",
  "wooden_table_game_ready_asset.glb",
  scene
);

const sometable = scene.getMeshByName("defaultMaterial");
console.log(sometable);

sometable.setParent(null);
sometable.scaling.set(0.025, 0.025, 0.025);
sometable.material.directIntensity = 0.8;
sometable.flipFaces(true);
sometable.setEnabled(false);
/*
const nw = await SceneLoader.ImportMeshAsync("", "/", "NL-c.w.m..glb", scene);
nw.meshes[0].scaling.scaleInPlace(0.005);
nw.meshes[0].position.x = 10;
nw.meshes[0].position.z = 10;
nw.meshes[0].position.y -= 3;
*/
sometable.position.x = 10;
sometable.position.z = 10;
sometable.position.y -= 5.2;

await SceneLoader.ImportMeshAsync("", "/", "old_soviet_backpack.glb", scene);

const backpack = scene.getMeshByName("bag_r_low_main bag_0");
backpack.setParent(null);
backpack.scaling.set(0.5, 0.5, 0.5);
backpack.position.y = backpack.position.y + 1;
backpack.flipFaces(true);
backpack.bakeCurrentTransformIntoVertices();
backpack.material.directIntensity = 0.8;

const wallMaterial = new PBRMaterial("wall", scene);
wallMaterial.albedoTexture = new Texture(
  "/old-stone-wall/old-stone-wall_base_1k.jpg",
  scene
);
wallMaterial.metallicTexture = new Texture(
  "/old-stone-wall/old-stone-wall_rough_1k.jpg",
  scene
);
wallMaterial.bumpTexture = new Texture(
  "/old-stone-wall/old-stone-wall_normal_1k.jpg",
  scene
);

wallMaterial.ambientTexture = new Texture(
  "/old-stone-wall/old-stone-wall_ao_1k.jpg",
  scene
);

wallMaterial.detailMap.texture = new Texture(
  "/old-stone-wall/old-stone-wall_det_1k.jpg",
  scene
);

function makeMat(mat: PBRMaterial, matObj: any) {
  /*
  mat.albedoTexture = new Texture(
    "/" + matObj.folder + "/" + matObj.albedo,
    scene
  );
    */
  mat.albedoTexture.updateURL("/" + matObj.folder + "/" + matObj.albedo);
  mat.bumpTexture.updateURL("/" + matObj.folder + "/" + matObj.bump);
  mat.metallicTexture.updateURL("/" + matObj.folder + "/" + matObj.metallic);
  mat.ambientTexture.updateURL("/" + matObj.folder + "/" + matObj.ao);
  if (matObj.detail) {
    mat.detailMap.texture.updateURL("/" + matObj.folder + "/" + matObj.detail);
  }
  console.log("/" + matObj.folder + "/" + matObj.albedo);
}

setTimeout(() => {
  makeMat(wallMaterial, exposedBrick);
  console.log("exposedBrick is done");
}, 3000);
/*
setTimeout(() => {
  makeMat(wallMaterial, oldStone2);
  console.log("oldStone2 is done");
}, 5000);

setTimeout(() => {
  makeMat(wallMaterial, greyWood);
  console.log("greyWood is done");
}, 7000);

setTimeout(() => {
  makeMat(wallMaterial, whiteLeather);
  console.log("whiteLeather is done");
}, 9000);

setTimeout(() => {
  makeMat(wallMaterial, oldTiles);
  console.log("darkConcrete is done");
}, 11000);
*/

wallMaterial.detailMap.isEnabled = false;
wallMaterial.detailMap.texture.level = 0.2;

wallMaterial.bumpTexture.level = 1.2;

wallMaterial.iridescence.isEnabled = false;
wallMaterial.iridescence.intensity = 0.9;

// wallMaterial.lightmapTexture = new Texture('/lightmap.png', scene);
/*
wallMaterial.useRoughnessFromMetallicTextureAlpha = false;
wallMaterial.useRoughnessFromMetallicTextureGreen = true;
wallMaterial.useMetallnessFromMetallicTextureBlue = true;
*/
wallMaterial.albedoTexture.uScale = 2.0;
wallMaterial.albedoTexture.vScale = 2.0;
wallMaterial.metallicTexture.uScale = 2.0;
wallMaterial.metallicTexture.vScale = 2.0;
wallMaterial.bumpTexture.uScale = 2.0;
wallMaterial.bumpTexture.vScale = 2.0;
wallMaterial.useParallax = false;
wallMaterial.useParallaxOcclusion = false;
wallMaterial.parallaxScaleBias = 0.2;
wallMaterial.specularPower = 1000.0;
wallMaterial.specularColor = new Color3(0.5, 0.5, 0.5);

const columns = 1;
const rows = 1;

const faceUV = new Array(6);

for (let i = 0; i < 6; i++) {
  faceUV[i] = new BABYLON.Vector4(i / columns, 0, (i + 1) / columns, 1 / rows);
}

const wall = MeshBuilder.CreateBox(
  "box",
  {
    width: MAP_SIZE,
    depth: MAP_SIZE,
    height: MAP_SIZE,
    faceUV: faceUV,
    wrap: true,
  },
  scene
);
// wall.material = wallMaterial;
// wall.checkCollisions = true;

const floor = MeshBuilder.CreateBox(
  "box",
  { height: MAP_SIZE, width: MAP_SIZE },
  scene
);
// floor.material = wallMaterial;
// floor.checkCollisions = true;

// ground.checkCollisions = true
// ground.material = rockMaterial
// ground.applyDisplacementMap('parquet_displacement.jpg', 1, 1)

const torchLight = new PointLight("torchLight", new Vector3(0, 1, 0), scene);
torchLight.intensity = 10;
torchLight.diffuse = new Color3(1, 0.3, 0.05);

const shadows = new ShadowGenerator(1024, torchLight);
shadows.useExponentialShadowMap = true;

floor.material = wallMaterial.clone("floorMat");
floor.material.maxSimultaneousLights = 12;
floor.checkCollisions = true;
floor.receiveShadows = true;
makeMat(floor.material, checkerTiles);

floor.material.getActiveTextures().forEach((t: any) => {
  // t.uScale = 2.25;
  // t.vScale = 2.25;
});

wall.material = wallMaterial;
wall.material.maxSimultaneousLights = 12;
wall.checkCollisions = true;
wall.receiveShadows = true;

// shadows.addShadowCaster(wall)

const torch = scene.getMeshByName("torch") as Mesh;
const barrel = scene.getMeshByName("barrel") as Mesh;
const pillar = scene.getMeshByName("pillar") as Mesh;
const web = scene.getMeshByName("web") as Mesh;
const bone = scene.getMeshByName("bone") as Mesh;
const cage = scene.getMeshByName("cage") as Mesh;
const arch = scene.getMeshByName("arch") as Mesh;
// const rack = Mesh.MergeMeshes([
//   scene.getMeshByName('rack_primitive1') as Mesh,
//   scene.getMeshByName('rack_primitive0') as Mesh
// ]) as Mesh
const skeleton = Mesh.MergeMeshes([
  scene.getMeshByName("skeleton_primitive0") as Mesh,
  scene.getMeshByName("skeleton_primitive1") as Mesh,
  scene.getMeshByName("skeleton_primitive2") as Mesh,
  scene.getMeshByName("skeleton_primitive3") as Mesh,
  scene.getMeshByName("skeleton_primitive4") as Mesh,
]) as Mesh;

cage.scaling = new Vector3(2.5, 2.5, 2.5);
cage.checkCollisions = true;
cage.receiveShadows = true;

bone.scaling = new Vector3(3, 3, 3);
bone.receiveShadows = true;
// bone.showBoundingBox = true;

barrel.checkCollisions = true;
barrel.receiveShadows = true;

web.rotation = new Vector3(Math.PI / 2, 0, 0);
web.receiveShadows = true;
// web.showBoundingBox = true;

pillar.checkCollisions = true;
pillar.scaling = new Vector3(3.2, 3.2, 3.2);
pillar.position = new Vector3(0, -10, 0);
pillar.receiveShadows = true;

arch.checkCollisions = true;
arch.receiveShadows = true;
arch.rotation = new Vector3(-(Math.PI / 2), 0, Math.PI);
arch.position.x += 0.15;
arch.scaling.scaleInPlace(1.05);
arch.bakeCurrentTransformIntoVertices();

torch.scaling = new Vector3(0.02, 0.02, 0.02);
torch.rotation = new Vector3(0.37, 0, 0);
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

skeleton.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

bone.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

cage.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

barrel.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

arch.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

torch.simplify(
  [
    { distance: 100, quality: 0.8 },
    { distance: 250, quality: 0.6 },
    { distance: 300, quality: 0.5 },
    { distance: 400, quality: 0.3 },
    { distance: 500, quality: 0.1 },
  ],
  false,
  SimplificationType.QUADRATIC
);

const dungeonBuilder = new DungeonGenerator(
  11,

  {
    pillarMesh: pillar,
    floorMesh: floor,
    wallMesh: wall,
    archMesh: arch,
    doorMesh: floor,
    blockSize: 10,
    decorMeshes: [
      {
        chance: 0.5,
        mesh: torch,
        indent: 1.84,
        name: "torch",
        yAxis: 2.5,
        rotateByX: -(Math.PI / 2),
        rotateByZ: Math.PI,
      },
      {
        chance: 0.05,
        mesh: cage,
        indent: 1.65,
        name: "cage",
        yAxis: 2,
        moveFromCenter: -3,
      },
      /*
      {
        chance: 0.03,
        mesh: rack,
        indent: 1.8,
        name: "rack",
        exclusive: true,
        rotateByX: -Math.PI,
        rotateByZ: -(Math.PI / 2),
      },
      */
      {
        chance: 0.03,
        mesh: sometable,
        indent: 0.3,
        name: "sometable",
        exclusive: false,
        rotateByX: -(Math.PI / 2),
        rotateByZ: -Math.PI,
      },
      {
        chance: 0.03,
        mesh: skeleton,
        indent: 1.8,
        name: "skeleton",
        exclusive: true,
        rotateByX: -(Math.PI / 2),
        rotateByZ: -Math.PI,
      },
      { chance: 0.2, mesh: barrel, indent: 1.65, name: "barrel" },
      { chance: 0.1, mesh: bone, name: "bone", yAxis: -4.45 },
      {
        chance: 0.2,
        mesh: web,
        indent: 2,
        name: "web",
        yAxis: 3.2,
        moveFromCenter: 3,
        rotateByZ: -(Math.PI / 2),
      },
      {
        chance: 0.3,
        mesh: backpack,
        indent: 0.2,
        name: "backpack",
        exclusive: true,
        rotateByX: Math.PI / 2,
        rotateByZ: Math.PI,
      },
    ],
  },
  shadows,
  scene
);

const { startPositions, wallMesh, floorMesh } = dungeonBuilder.build();
//console.log(dungeonBuilder.dungeon);

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

if (!startPositions?.[0]) throw new Error("Position for start is not exists");

const camera = new FreeCamera("camera", startPositions[0], scene);

camera.attachControl(canvas, true);

camera.ellipsoid = new Vector3(1, 2, 1);

const sphere = MeshBuilder.CreateSphere("sphere", {
  diameter: 5 * MAP_SIZE,
  segments: 32,
});
/*
sphere.material = wallMaterial.clone("sphMat");
sphere.material.sideOrientation = 2;
sphere.material.backFaceCulling = false;
sphere.material.getActiveTextures().forEach((element) => {
  element.uScale = 10;
  element.vScale = 10;
});
*/

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

new CharacterController("FPS", camera, scene, ["floor"]);

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
skyMaterial.luminance = 1;
skyMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
skyMaterial.sunPosition = new Vector3(50, 50, 0);
skyMaterial.rayleigh = 2;

const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, scene);
skybox.material = skyMaterial;

window.addEventListener("resize", () => engine.resize());

scene.meshes.forEach((m: any) => {
  // m.showBoundingBox = true;
});

let changedMat = wallMaterial;

const pane = new Pane({
  container: document.getElementById("topDiv"),
});

const btn = pane.addButton({
  title: "Show",
  label: "Inspector", // optional
});

let count = false;
btn.on("click", () => {
  count = !count;
  console.log(count);
  if (count) {
    scene.debugLayer.show();
    btn.title = "Hide";
  } else {
    scene.debugLayer.hide();
    btn.title = "Show";
    console.log({ btn });
  }
});

for (let i = 0; i < texArray.length; i++) {
  const texObj = texArray[i];
  console.log(texObj.folder);

  const btn = pane.addButton({
    title: texObj.folder,
    //   label: "counter", // optional
  });

  let count = 0;
  btn.on("click", () => {
    count += 1;
    console.log(count);

    makeMat(changedMat, texObj);
  });

  //  topDiv.innerHTML += "<p>" + texObj.folder + "</p>";
}

const PARAMS = {
  speed: 0.5,
  Tiles: wallMaterial.albedoTexture.uScale,
};

const tiling = pane.addBinding(PARAMS, "Tiles", {
  step: 0.1,
  min: 0.1,
  max: 5,
});
tiling.on("change", function (ev: any) {
  console.log(`change: ${ev.value}`);
  changedMat.getActiveTextures().forEach((t: any) => {
    t.uScale = ev.value;
    t.vScale = ev.value;
  });
});

const PARAMS2 = {
  Material: 0,
};

const matChange = pane.addBinding(PARAMS2, "Material", {
  options: {
    Wall: 0,
    Floor: 50,
  },
});

matChange.on("change", function (ev: any) {
  console.log(`change: ${ev.value}`);

  if (ev.value == 50) {
    changedMat = floor.material;
  } else {
    changedMat = wallMaterial;
  }
});

const hideMap = pane.addBinding({ hideMap: false }, "hideMap");

hideMap.on("change", function (ev: any) {
  console.log(`change: ${ev.value}`);
  if (ev.value) {
    document.getElementById("mapCanvas")!.style.display = "none";
  } else {
    document.getElementById("mapCanvas")!.style.display = "initial";
  }
});

const plane = MeshBuilder.CreatePlane("plane", { size: 6 });
//plane.rotation.x = -Math.PI / 4;
plane.rotation.y = Math.PI;
plane.material = new StandardMaterial("planeMat");
plane.position = new Vector3(10, 1, 5.2);
plane.showBoundingBox = false;
//
//
/*
// load textures and meshes
const assets = {
  manager: new BABYLON.AssetsManager(scene),
  brickSphere: undefined,
};
const meshes = {};
const decalsTex = [];
async function loadMeshes() {
  // mesh task
  (assets.brickSphere as any) = assets.manager.addMeshTask(
    "brickSphere",
    "",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/gltf/",
    "brickSphere.glb"
  );

  // texture tasks
  assets.graffiti_01 = assets.manager.addTextureTask(
    "graffiti_01",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_B.png"
  );
  assets.graffiti_02 = assets.manager.addTextureTask(
    "graffiti_02",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot01.png"
  );
  assets.graffiti_03 = assets.manager.addTextureTask(
    "graffiti_03",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot02.png"
  );
  assets.graffiti_04 = assets.manager.addTextureTask(
    "graffiti_04",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot03.png"
  );
  assets.graffiti_05 = assets.manager.addTextureTask(
    "graffiti_05",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot04.png"
  );
  assets.graffiti_06 = assets.manager.addTextureTask(
    "graffiti_06",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot05.png"
  );
  assets.graffiti_07 = assets.manager.addTextureTask(
    "graffiti_07",
    "https://patrickryanms.github.io/BabylonJStextures/Demos/textureDecals/assets/textures/tag_dot06.png"
  );

  // call all loading tasks
  assets.manager.load();

  // task error handling
  assets.manager.onTaskErrorObservable.add((task) => {
    console.log("Error loading task: " + task.name);
    console.log(task.errorObject.message, task.errorObject.exception);
  });

  // task success handling
  assets.manager.onFinish = (tasks) => {
    console.log("Finished loading tasks", tasks);

    // get root transform
    meshes.sphereRoot = assets.brickSphere.loadedMeshes[0];
    meshes.sphereRoot.scaling.scaleInPlace(10);

    // get brick sphere mesh
    for (let mesh of meshes.sphereRoot.getChildren(undefined, false)) {
      if (mesh.name === "brickSphere") {
        meshes.brickSphere = mesh;
      }
    }
    console.log(meshes.sphereRoot);
    //
    assets.rtt = new RenderTargetTexture(
      "decalRTT",
      { width: 2048, height: 2048 },
      scene
    );

    if (
      meshes.brickSphere.getTotalVertices() > 0 &&
      meshes.brickSphere.material &&
      meshes.brickSphere.material.decalMap
    ) {
      meshes.brickSphere.decalMap = new BABYLON.MeshUVSpaceRenderer(
        meshes.brickSphere,
        scene,
        { width: 4096, height: 4096 }
      );
      meshes.brickSphere.material.decalMap.smoothAlpha = true;
      meshes.brickSphere.material.decalMap.isEnabled = true;
    }

    // push all loaded textures into
    decalsTex.push(assets.graffiti_01.texture);
    decalsTex.push(assets.graffiti_02.texture);
    decalsTex.push(assets.graffiti_03.texture);
    decalsTex.push(assets.graffiti_04.texture);
    decalsTex.push(assets.graffiti_05.texture);
    decalsTex.push(assets.graffiti_06.texture);
    decalsTex.push(assets.graffiti_07.texture);
  };
}
const decal = {
  tagSize: new BABYLON.Vector3(0.9, 0.9, 0.9),
  dotSize: new BABYLON.Vector3(0.6, 1.2, 1.2),
  current: 0,
  angle: 0,
  angleScale: 0.5,
  mesh: undefined,
  projector: undefined,
};

// create projector for decal placement into mesh UV space
function createProjector() {
  decal.projector = BABYLON.MeshBuilder.CreateBox(
    "projector",
    { width: decal.tagSize.x, height: decal.tagSize.y, depth: decal.tagSize.z },
    scene
  );
  decal.projector.material = new BABYLON.StandardMaterial(
    "projectorMat",
    scene
  );
  decal.projector.material.alpha = 0;
  decal.projector.material.disableDepthWrite = true;
  decal.projector.enableEdgesRendering(0);
  decal.projector.edgesWidth = 0.2;
  decal.projector.visibility = 0;
}

const getPositionAtMouseLocation = () => {
  return new Promise((resolve) => {
    const texturePos = gbr.getGBuffer().textures[2];
    texturePos
      .readPixels(
        -1,
        0,
        null,
        true,
        false,
        scene.pointerX,
        engine.getRenderHeight() - scene.pointerY,
        1,
        1
      )
      .then((buffer) => {
        const p = BABYLON.Vector3.FromArray(buffer);
        resolve(
          p.x === 0 && p.y === 0 && p.z === 0 && buffer[3] === 0 ? null : p
        );
      });
  });
};

// write decal texture into render target for decal map
const createDecal = async () => {
  let position = await getPositionAtMouseLocation();
  if (position) {
    const normal = scene.activeCamera
      .getForwardRay()
      .direction.negateInPlace()
      .normalize();
    const sourceMesh = meshes.brickSphere;

    if (decal.current === 0) {
      decal.currentSize = decal.tagSize;
    } else {
      decal.currentSize = decal.dotSize;
    }

    sourceMesh.decalMap.renderTexture(
      decalsTex[decal.current],
      position,
      normal,
      decal.currentSize,
      decal.angle
    );
    decal.current = (decal.current + 1) % decalsTex.length;
  }
};

const gbr = scene.enableGeometryBufferRenderer();

gbr.enablePosition = true;

scene.onDisposeObservable.add(() => {
  scene.disableGeometryBufferRenderer();
});

// position and rotate projector on mesh based on pick ray
scene.onPointerMove = async function (evt) {
  let position = await getPositionAtMouseLocation();
  if (position) {
    decal.projector.visibility = 1;

    const normal = scene.activeCamera
      .getForwardRay()
      .direction.negateInPlace()
      .normalize();
    const sourceMesh = meshes.brickSphere;

    decal.mesh = sourceMesh;

    const yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
    const len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
    const pitch = Math.atan2(normal.y, len);

    decal.projector.position.copyFrom(position);
    decal.projector.rotation.set(pitch, yaw, decal.angle);
  } else {
    decal.projector.visibility = 0;
    decal.mesh = null;
  }
};

// if mouse button released, place next decal at projector postion in mesh UV space
scene.onPointerObservable.add((evtData, evtState) => {
  switch (evtData.type) {
    case BABYLON.PointerEventTypes.POINTERUP:
      if (evtData.event.button === 0) {
        createDecal();
      }
      break;
  }
});
//
await loadMeshes();
createProjector();
*/
//
//
//
/*
const tetra = MeshBuilder.CreatePolyhedron("tetra", { type: 8, size: 10 });
tetra.rotation.x = Tools.ToRadians(-139);
tetra.rotation.y = Tools.ToRadians(-10);
tetra.rotation.z = Tools.ToRadians(9);

tetra.position = new Vector3(80, 1, 20);

tetra.scaling.scaleInPlace(2.1);

tetra.material = floor.material;
tetra.material.backFaceCulling = false;
//
//
//

scene.registerBeforeRender(() => {
  // scene.meshes.forEach(mesh => {
  //   if (mesh?.isOccluded) mesh.getChildren()?.[0]?.setEnabled(false)
  //   else mesh.getChildren()?.[0]?.setEnabled(true)
  // })
});
*/
// Render every frame
engine.runRenderLoop(() => {
  scene.render();
});
