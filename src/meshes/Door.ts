import { Mesh, Scene, SceneLoader, Animation, Sound, SimplificationType } from "@babylonjs/core"

export default class Door {
    private _mesh: Mesh | undefined;
    private _scene: Scene;
    private _state: Record<string, any> = {};
    private _openSound: Sound;
    private _closeSound: Sound;


    constructor(scene: Scene) {
        this._scene = scene;
        this._openSound = new Sound('walk', '/sounds/openDoor.wav', this._scene, null, { spatialSound: true });
        this._closeSound = new Sound('walk', '/sounds/closeDoor.wav', this._scene, null, { spatialSound: true });
    }

    async load() {
        await SceneLoader.ImportMeshAsync('', '/', 'door.glb', this._scene);

        this._mesh = Mesh.MergeMeshes([
            this._scene.getMeshByName('door_primitive0') as Mesh,
            this._scene.getMeshByName('door_primitive1') as Mesh
        ]) as Mesh

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
            actionName: 'Open',
            runAction: this._runAction.bind(this)
        }

        return this._mesh
    }

    private _runAction(mesh: Mesh) {
        if (isNaN(this._state?.[mesh?.uniqueId]?.initRotation)) {
            this._state = { 
                ...this._state, 
                [mesh.uniqueId]: { 
                    ...(this._state?.[mesh.uniqueId] || {}), 
                    initRotation: mesh.rotation.y 
                } 
            }
        }

        const animation = new Animation('openDoor', 'rotation.y', 20, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const openKeys = [
            {
                frame: 0,
                value: this._state?.[mesh.uniqueId]?.initRotation
            },
            {
                frame: 20,
                value: this._state?.[mesh.uniqueId]?.initRotation + (Math.PI / 2)
            }
        ]

        animation.setKeys(openKeys);
        animation.enableBlending = true;
	    animation.blendingSpeed = 0.01;

        if (this._state?.[mesh?.uniqueId]?.isOpen) {
            this._closeSound.attachToMesh(mesh)
            this._closeSound.play()
            this._scene.beginDirectAnimation(mesh, [animation], 20, 0)
            this._state = { 
                ...this._state, 
                [mesh.uniqueId]: { 
                    ...(this._state?.[mesh.uniqueId] || {}), 
                    isOpen: false 
                } 
            }
        } else {
            this._openSound.attachToMesh(mesh)
            this._openSound.play()
            this._scene.beginDirectAnimation(mesh, [animation], 0, 20)
            this._state = { 
                ...this._state, 
                [mesh.uniqueId]: { 
                    ...(this._state?.[mesh.uniqueId] || {}), 
                    isOpen: true 
                } 
            };
        }
    }

    get mesh() {
        return this._mesh
    }
}