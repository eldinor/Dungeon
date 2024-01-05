import { Mesh, Scene, SceneLoader, SimplificationType, Vector3 } from "@babylonjs/core"

export default class Chain {
    private _mesh: Mesh | undefined;
    private _scene: Scene;


    constructor(scene: Scene) {
        this._scene = scene;
    }

    async load() {
        await SceneLoader.ImportMeshAsync('', '/meshes/', 'chain.glb', this._scene);

        this._mesh = this._scene.getMeshByName('chain') as Mesh

        this._mesh.showBoundingBox = true;

        this._mesh.scaling = new Vector3(0.06, 0.06, 0.06);
        this._mesh.rotation = new Vector3(0, 0.4, Math.PI / 2)

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