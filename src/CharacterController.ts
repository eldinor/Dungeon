import { ArcRotateCamera, FreeCamera, ActionManager, HighlightLayer, Sound, Scene, ExecuteCodeAction, Mesh, Ray, RayHelper, Scalar, Vector3, Color3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, Ellipse, Rectangle, Grid, Slider, Control } from '@babylonjs/gui'

export default class CharacterController {
    private scene : Scene;
    private character: Mesh;
    private speed : number = 0.0018;
    private jumpMeshesIds : string[] = [];
    private camera: ArcRotateCamera | FreeCamera;
    private gravity : Vector3 = new Vector3(0, -0.1, 0);
    private inputMap : Record<string, boolean> = {}
    private stamina : number = 1000;
    private highlighter: HighlightLayer;
    private jumpCounter : number = 500;
    private jumpSpeed : number = 0.01;
    private pickedMesh : Mesh | unknown;
    private actionEvent : ExecuteCodeAction | undefined;
    private UI : AdvancedDynamicTexture;
    private health: number = 100;
    private healthBar: Slider;
    private staminaBar: Slider;
    private steps: Sound[];
    private counter: number = 0;
    private stepIndex: number = 0;
    private moveKeys: number[];
    public backpack: Mesh[] = [];
    private slots: Grid;

    constructor(camera: ArcRotateCamera | FreeCamera, scene: Scene, jumpMeshesIds: string[], character: Mesh) {
        this.scene = scene;
        this.camera = camera;

        if (!(this.camera instanceof FreeCamera)) throw new Error('For FPS mode camera must be FreeCamera instance');

        this.jumpMeshesIds = jumpMeshesIds;
        this.highlighter = new HighlightLayer("focus", this.scene)
        this.UI = AdvancedDynamicTexture.CreateFullscreenUI("UI")
        this.character = character;
        this.character.parent = this.camera;

        this.steps = [
            new Sound('step1', '/sounds/step1.wav', this.scene, null), 
            new Sound('step2', '/sounds/step2.wav', this.scene, null)
        ]

        this.camera.keysUp = [87];
        this.camera.keysDown = [83];
        this.camera.keysLeft = [65];
        this.camera.keysRight = [68];
        this.camera.inertia = 0.2;
        this.camera.fov = 1.5;
        this.camera.minZ = 0;
        this.camera.angularSensibility = 500;
        this.scene.gravity = this.gravity;
        this.scene.collisionsEnabled = true;
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.needMoveForGravity = true;
        this.camera.onCollide = (mesh) => {
            if (this.jumpMeshesIds.includes(mesh?.id)) this.jumpCounter = 500;
        }
        this.camera.ellipsoid = new Vector3(0.25, 1.5, 0.25);

        this.scene.actionManager = new ActionManager(this.scene)

        const downAction = new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
            this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
        })

        const upAction = new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
            this.inputMap[event?.sourceEvent.keyCode] = event.sourceEvent.type === 'keydown'
        })

        this.moveKeys = [ 
            ...this.camera.keysUp,
            ...this.camera.keysDown,
            ...this.camera.keysLeft,
            ...this.camera.keysRight 
        ]

        this.slots = new Grid('backpack');
        this.slots.width = '400px';
        this.slots.height = '100px';
        this.slots.addRowDefinition(1)

        for (let j = 0; j < 4; j++) {
            this.slots.addColumnDefinition(1 / 4);

            const slot = new Rectangle(`slot${j}`);
            slot.width = "98%";
            slot.height = "100%";
            this.slots.addControl(slot, 0, j);
        }

        this.slots.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        this.UI.addControl(this.slots)


        const aim = new Ellipse();
        aim.width = "5px"
        aim.height = "5px";
        aim.color = 'white';
        aim.thickness = 4;
        this.UI.addControl(aim);  

        this.healthBar = new Slider()
        this.healthBar.minimum = 0;
        this.healthBar.maximum = 100;
        this.healthBar.height = "30px";
        this.healthBar.width = "200px";
        this.healthBar.displayThumb = false;
        this.healthBar.color = "red";
        this.healthBar.top = '20px'
        this.healthBar.left = '20px'
        this.healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.UI.addControl(this.healthBar)


        this.staminaBar = new Slider()
        this.staminaBar.minimum = 0;
        this.staminaBar.maximum = 1000;
        this.staminaBar.height = "30px";
        this.staminaBar.width = "200px";
        this.staminaBar.displayThumb = false;
        this.staminaBar.color = "green";
        this.staminaBar.top = '50px'
        this.staminaBar.left = '20px'
        this.staminaBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.staminaBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.UI.addControl(this.staminaBar)

        this.scene.actionManager.registerAction(downAction)
        this.scene.actionManager.registerAction(upAction)

        this.scene.onBeforeRenderObservable.add(() => {
            this._updateFPSCharacterPosition();
        }) 
    }

    public addToBackPack(mesh: Mesh) {
        if (this.backpack?.length >= 4) return;

        this.backpack.push(mesh)
    }

    private focusMesh(mesh: Mesh) {
        if (mesh?.metadata?.withAction) {
            this.highlighter.addMesh(mesh, Color3.White())
            this.actionEvent = new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnKeyUpTrigger,
                    parameter: mesh.metadata.actionButton
                },
                () => mesh.metadata.runAction(mesh)
            )

            this.scene.actionManager.registerAction(this.actionEvent);

            const button = new Rectangle('button')
            button.adaptWidthToChildren = true;
            button.adaptHeightToChildren = true;
            button.paddingTop = 60
            button.cornerRadius = 0;
            button.color = "Black";
            button.thickness = 2;
            button.background = "White";
            this.UI.addControl(button); 

            const text = new TextBlock();
            text.text = mesh.metadata.actionButton;
            text.width = "30px"
            text.height = '30px'
            text.color = "black";
            text.fontSize = 20;
            button.addControl(text);

            const actionName = new TextBlock('action')
            actionName.text = mesh?.metadata?.actionName;
            actionName.paddingTop = 60
            actionName.paddingLeft = 90
            actionName.height = '30px'
            actionName.color = "white";
            actionName.fontSize = 20;
            this.UI.addControl(actionName);
        }
    }

    private unfocusMesh(mesh: Mesh) {
        if (mesh?.metadata?.withAction) {
            this.highlighter.removeMesh(mesh)
            if (this.actionEvent) this.scene.actionManager.unregisterAction(this.actionEvent)
            this.UI.removeControl(this.UI.getControlByName('button') as Control)
            this.UI.removeControl(this.UI.getControlByName('action') as Control)
        }
    }

    private _isMoving(): boolean {
        return this.moveKeys.some(key => this.inputMap?.[key])
    }

    private _lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
 
    private _updateFPSCharacterPosition(): void {
        this.healthBar.value = this.health;
        this.staminaBar.value = this.stamina;

        const origin = this.camera.position;
        const dt = this.scene.getEngine().getFps() * this.scene.deltaTime;
        const speed = this.speed * dt

        const ray = new Ray(origin.add(this.character.forward), this.camera.getDirection(Vector3.Backward()), 2);

        const hit = this.scene.pickWithRay(ray)

        if (this._isMoving()) {
            if (this.counter >= 200) {
                this.steps[this.stepIndex].play()
                this.counter = 0;
                this.stepIndex++;
                if (this.stepIndex >= this.steps?.length) this.stepIndex = 0
            }
            this.counter += this.camera.speed
        }

        if ((this.pickedMesh as Mesh)?.uniqueId !== hit?.pickedMesh?.uniqueId) {
            this.focusMesh(hit?.pickedMesh as Mesh);
            this.unfocusMesh(this.pickedMesh as Mesh);
            this.pickedMesh = hit?.pickedMesh;
        }

        if (this.stamina <= 0) this.camera.speed = speed

        // if ((this.inputMap['32'] || this.jumpCounter !== 500) && this.stamina > 0) {
        //     this.jumpCounter -= dt * this.jumpSpeed


        //     this.camera.cameraDirection.y = (this.jumpCounter / 1200000) * dt;
        //     this.stamina--
        // }

        if (this.jumpCounter <= 0) this.camera.cameraDirection.y = 0

        if (this.inputMap['16'] && this.stamina > 0) {
            this.camera.speed = (this.speed + 0.001) * dt
            this.stamina -= 0.002 * dt
        }

        if (!this.inputMap['16']) this.camera.speed = speed

        if (!this.inputMap['16'] && !this.inputMap['32'] && this.stamina < 1000) this.stamina += 0.001 * dt
        
    }
}