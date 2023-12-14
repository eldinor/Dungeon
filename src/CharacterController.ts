import { ArcRotateCamera, FreeCamera, ActionManager, Scene, ExecuteCodeAction, Mesh, Ray, Scalar, Vector3 } from "@babylonjs/core";

type GameMode = 'RPG' | 'FPS'

export default class CharacterController {
    private scene : Scene;
    private character: Mesh;
    private speed : number = 0.1;
    private mode : GameMode;
    private jumpMeshesIds : string[] = [];
    private camera: ArcRotateCamera | FreeCamera;
    private gravity : Vector3 = new Vector3(0, -0.3, 0);
    private inputMap : Record<string, boolean> = {}
    private stamina : number = 1000;
    private cooldownJump : number = 50;
    private jumpCounter : number = 25;

    constructor(mode: GameMode, camera: ArcRotateCamera | FreeCamera, scene: Scene, jumpMeshesIds: string[], character?: Mesh) {
        this.scene = scene;
        this.camera = camera;
        this.jumpMeshesIds = jumpMeshesIds;
        this.mode = mode;

        switch (this.mode) {
            case 'RPG': {
                if (!character) throw new Error('For RPG mode you must choose character');

                this.character = character;
                this.scene.actionManager = new ActionManager(this.scene)
        
                const downAction = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
                    this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
                })
        
                const upAction = new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
                    this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
                })
        
                this.scene.actionManager.registerAction(downAction)
                this.scene.actionManager.registerAction(upAction)
        
                this.scene.onBeforeRenderObservable.add(() => {
                    this._updateRPGCharacterPosition();
                })
            
                break;
            }
            case 'FPS': {
                if (!(this.camera instanceof FreeCamera)) throw new Error('For FPS mode camera must be FreeCamera instance');

                this.camera.keysUp = [87];
                this.camera.keysDown = [83];
                this.camera.keysLeft = [65];
                this.camera.keysRight = [68];
                this.camera.inertia = 0.2;
                this.camera.fov = 1.5;
                this.camera.minZ = 0;
                this.camera.angularSensibility = 500;
                this.camera.speed = 2.5;
                this.scene.gravity = this.gravity;
                this.scene.collisionsEnabled = true;
                this.camera.checkCollisions = true;
                this.camera.applyGravity = true;
                (this.camera as any)._needMoveForGravity = true;
                this.camera.onCollide = (mesh) => {
                    if (this.jumpMeshesIds.includes(mesh?.id)) {
                        this.jumpCounter = 25;
                        this.scene.gravity.y = -0.2
                    }
                }
                this.camera.ellipsoid = new Vector3(0.25, 1.5, 0.25);

                this.scene.actionManager = new ActionManager(this.scene)

                const downAction = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
                    this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
                })
        
                const upAction = new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
                    this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
                })

                this.scene.actionManager.registerAction(downAction)
                this.scene.actionManager.registerAction(upAction)

                this.scene.onBeforeRenderObservable.add(() => {
                    this._updateFPSCharacterPosition();
                })

                break;
            }
        }
    }   

    private _updateRPGCharacterPosition(): void {
        if (this.inputMap["87"]) this.character.moveWithCollisions(this.character.forward.scale(this.speed).add(this.gravity))
        if (this.inputMap["83"]) this.character.moveWithCollisions(this.character.forward.scale(-this.speed).add(this.gravity))
        if (this.inputMap["65"]) this.character.moveWithCollisions(this.character.right.scale(-this.speed).add(this.gravity))
        if (this.inputMap["68"]) this.character.moveWithCollisions(this.character.right.scale(this.speed).add(this.gravity))
    }

    private _updateFPSCharacterPosition(): void {
        if (this.stamina <= 0) {
            this.scene.gravity.y = -0.2
            this.camera.speed = 2.5
        }

        if ((this.inputMap['32'] || this.jumpCounter !== 25) && this.stamina > 0) {
            this.scene.gravity.y = 0.1 + 0.007 * this.jumpCounter;
            this.jumpCounter--;
            this.stamina--
        }

        if (this.inputMap['16'] && this.stamina > 0) {
            this.camera.speed = 3.5
            this.stamina--
        }

        if (!this.inputMap['16']) this.camera.speed = 2.5

        if (!this.inputMap['16'] && !this.inputMap['32'] && this.stamina < 1000) this.stamina++
        
    }
}