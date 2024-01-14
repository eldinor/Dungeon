import { Mesh, Scene, SceneLoader, SimplificationType, Vector3 } from "@babylonjs/core"

export default class Web {
    private _mesh: Mesh | undefined;
    private _scene: Scene;


    constructor(scene: Scene) {
        this._scene = scene;
    }

    async load() {
        await SceneLoader.ImportMeshAsync('', '/meshes/', 'web.glb', this._scene);

        this._mesh = this._scene.getMeshByName('web') as Mesh
        
        this._mesh.rotation = new Vector3(Math.PI / 2, 0, 0);
        this._mesh.receiveShadows = true;

        return this._mesh
    }

    get mesh() {
        return this._mesh
    }
}