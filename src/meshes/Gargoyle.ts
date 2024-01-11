import { Mesh, Scene, SceneLoader, Animation, AbstractMesh, Sound, SimplificationType, Vector3 } from "@babylonjs/core"
import { Image } from '@babylonjs/gui'
import CharacterController from "@/CharacterController";

export default class Gargoyle {
    private _mesh: Mesh | undefined;
    private _scene: Scene;
    private character: CharacterController;


    constructor(scene: Scene, character: CharacterController) {
        this._scene = scene;
        this.character = character;
        // this._openSound = new Sound('walk', '/sounds/openDoor.wav', this._scene, null, { spatialSound: true });
        // this._closeSound = new Sound('walk', '/sounds/closeDoor.wav', this._scene, null, { spatialSound: true });
    }

    async load(meshes: Mesh[]) {
        await SceneLoader.ImportMeshAsync('', '/meshes/', 'gargoyleHead.glb', this._scene);

        this._mesh = this._scene.getMeshByName('gargoyle_head') as Mesh

        this._mesh.scaling = new Vector3(0.03, 0.03, 0.03)

        this._mesh?.simplify([
            { distance: 100, quality: 0.8 },
            { distance:250, quality:0.6 }, 
            { distance:300, quality:0.5 }, 
            { distance:400, quality:0.3 }, 
            { distance:500, quality:0.1 }
        ], false, SimplificationType.QUADRATIC);

        this._mesh.metadata = {
            withAction : true,
            actionButton : 'E',
            actionName: 'Pick up',
            image : new Image('gargoyleHead', '/itemImages/gargoyleHead.png'),
            runAction: this._runAction.bind(this)
        }


        for (let i = 0; i < 4; i++) {
            const head = this._mesh.clone();

            head.position = meshes[Math.floor(Math.random() * (meshes?.length - 1))].position.add(new Vector3(0, 0.5, 0))

            head.isOccluded = true;
            head.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;
            head.freezeWorldMatrix()
        }

        return this._mesh
    }

    private _runAction(mesh: Mesh) {
        this.character.addToBackPack(mesh)
    }

    get mesh() {
        return this._mesh
    }
}