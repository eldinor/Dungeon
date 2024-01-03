import { MeshBuilder, TransformNode, RecastJSPlugin, Ray, Mesh, Scene, Vector3 } from '@babylonjs/core';
import AI from './AI';


export default class Skeleton {
    private mesh : Mesh;
    private fieldOfView : Mesh;
    private AI : AI;
    private state : string;
    private agentIndex : number;
    private characters: Mesh[];

    constructor(AI: AI, characters : Mesh[]) {
        this.AI = AI
        this.characters = characters;
        this.mesh = MeshBuilder.CreateBox('skeletonMesh', { size: 3 })
        this.fieldOfView = MeshBuilder.CreateSphere("cylinder", { diameter: 100 })

        const transform = new TransformNode('skeleton');

        this.mesh.showBoundingBox = true;
        this.mesh.isPickable = false;
        this.mesh.parent = transform
        this.fieldOfView.parent = this.mesh
        this.fieldOfView.isVisible = false

        this.agentIndex = this.AI.crowd.addAgent(this.AI.getRandomPosition(), {
            radius: 10,
            height: 0.2,
            maxAcceleration: 30.0,
            maxSpeed: 10.0,
            collisionQueryRange: 1,
            pathOptimizationRange: 0.0,
            separationWeight: 1.0
        }, transform)


        this.AI.scene.registerBeforeRender(() => {
            this.state = this.AI.crowd.getAgentVelocity(this.agentIndex).equals(Vector3.Zero()) ? 'standing' : 'running'

            if (this.state === 'standing') {
                const newPosition = this.AI.getRandomPosition()

                this.AI.crowd.agentGoto(this.agentIndex, this.AI.navigation.getClosestPoint(newPosition));
            }

            for (const character of this.characters) {
                if (this.fieldOfView.intersectsMesh(character, false)) {
                    const direction = character.getAbsolutePosition().subtract(this.mesh.getAbsolutePosition());

                    this.mesh.lookAt(direction)

                    if (this.mesh.intersectsMesh(character)) console.log('attack')

                    const ray = new Ray(this.mesh.getAbsolutePosition(), direction.normalize(), 100);

                    const hit = this.AI.scene.pickWithRay(ray)

                    if (character.uniqueId !== hit?.pickedMesh?.uniqueId) continue;

                    this.AI.crowd.agentGoto(this.agentIndex, this.AI.navigation.getClosestPoint(character.getAbsolutePosition()));
                }
            }
        })
    }

}