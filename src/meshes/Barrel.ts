import { Mesh, Scene, SceneLoader, SimplificationType, Vector3 } from "@babylonjs/core"

export default class Barrel {
    private _mesh: Mesh | undefined;
    private _scene: Scene;


    constructor(scene: Scene) {
        this._scene = scene;
    }

    async load() {
        await SceneLoader.ImportMeshAsync('', '/meshes/', 'barrel.glb', this._scene);

        this._mesh = this._scene.getMeshByName('barrel') as Mesh
        
        this._mesh.checkCollisions = true;
        this._mesh.receiveShadows = true;

        this._mesh?.simplify([
            { distance: 100, quality: 0.8 },
            { distance:250, quality:0.6 }, 
            { distance:300, quality:0.5 }, 
            { distance:400, quality:0.3 }, 
            { distance:500, quality:0.1 }
          ], false, SimplificationType.QUADRATIC);

        return this._mesh
    }

    get mesh() {
        return this._mesh
    }
}