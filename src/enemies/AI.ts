import { Mesh, RecastJSPlugin, ICrowd, Scene, Vector3 } from "@babylonjs/core";
import Recast from 'recast-detour'

const recast = await Recast()

export default class AI {
    public navigation : RecastJSPlugin;
    public scene: Scene;
    public crowd: ICrowd;
    private respawnPositions: Vector3[]
     
    constructor(navigationMeshes: Mesh[], maxAgents: number, maxAgentRadius: number, scene: Scene) {
        this.navigation = new RecastJSPlugin(recast);
        this.scene = scene;
        this.respawnPositions = navigationMeshes.map(mesh => mesh.position)

        this.navigation.createNavMesh(navigationMeshes, {
            cs: 0.2,
            ch: 0.2,
            walkableSlopeAngle: 35,
            walkableHeight: 1,
            walkableClimb: 1,
            walkableRadius: 9,
            maxEdgeLen: 12,
            maxSimplificationError: 1.3,
            minRegionArea: 8,
            mergeRegionArea: 20,
            maxVertsPerPoly: 6,
            detailSampleDist: 6,
            detailSampleMaxError: 1,
        })

        this.crowd = this.navigation.createCrowd(maxAgents, maxAgentRadius, this.scene)
    }

    public getRandomPosition() {
        const randomIndex = Math.floor(Math.random() * (this.respawnPositions?.length - 1))
        return this.respawnPositions[randomIndex]
    }
}