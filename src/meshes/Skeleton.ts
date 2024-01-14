import { Mesh, Scene, SceneLoader, SimplificationType, Vector3 } from "@babylonjs/core"

export default class Skeleton {
    private _mesh: Mesh | undefined;
    private _scene: Scene;


    constructor(scene: Scene) {
        this._scene = scene;
    }

    async load() {
        await SceneLoader.ImportMeshAsync('', '/meshes/', 'skeleton.glb', this._scene);

        this._mesh = Mesh.MergeMeshes([
            this._scene.getMeshByName("skeleton_primitive0") as Mesh,
            this._scene.getMeshByName("skeleton_primitive1") as Mesh,
            this._scene.getMeshByName("skeleton_primitive2") as Mesh,
            this._scene.getMeshByName("skeleton_primitive3") as Mesh,
            this._scene.getMeshByName("skeleton_primitive4") as Mesh
        ]) as Mesh
        
        this._mesh.receiveShadows = true;
        this._mesh.checkCollisions = true;

        
        this._mesh.simplify([
            { distance: 100, quality: 0.8 },
            { distance:250, quality:0.6 }, 
            { distance:300, quality:0.5 }, 
            { distance:400, quality:0.3 }, 
            { distance:500, quality:0.1 }
        ], false, SimplificationType.QUADRATIC)

        return this._mesh
    }

    get mesh() {
        return this._mesh
    }
}