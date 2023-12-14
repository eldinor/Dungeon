import { Mesh, ShadowGenerator, Vector3 } from '@babylonjs/core';
import dungeoneer from 'dungeoneer'

type DungeonConstructor = {
    pillarMesh : Mesh,
    floorMesh  : Mesh,
    wallMesh   : Mesh,
    doorMesh   : Mesh,
    blockSize  : number,
    decorMeshes : { 
        chance: number, 
        mesh: Mesh, 
        indent?: number, 
        name: string,
        exclusive? : boolean,
        xAxis?: number,
        yAxis?: number,
        zAxis?: number,
        rotateByX?: number,
        rotateByZ?: number,
        moveFromCenter?: number
    }[]
}

type PlaceArgs = {
    object: Record<string, any>,
    neighbor : Record<string, any>,
    decoration?: Record<string, any>,
    mesh : Mesh
}

export default class DungeonGenerator {
    private dungeon : Record<string, any>;
    private options : Record<string, any>;
    private wallMeshes : Mesh[] = [];
    private floorMeshes : Mesh[] = [];
    private shadows : ShadowGenerator;
    private pillarCounter : number = 0;

    constructor(size: number, options : DungeonConstructor, shadows: ShadowGenerator) {
        this.options = options;
        this.shadows = shadows;
        this.dungeon = dungeoneer.build({
            width: size,
            height: size
        })
    }

    private placeMesh({ object, neighbor, decoration, mesh }: PlaceArgs) {
        const indent = decoration?.indent || Math.random() * 2;

        mesh.position.x = decoration?.xAxis ? decoration?.xAxis : object.x * this.options.blockSize;
        mesh.position.z = decoration?.zAxis ? decoration?.zAxis : object.y * this.options.blockSize;
        mesh.position.y = decoration?.yAxis ? decoration?.yAxis : -(this.options.blockSize / 2.15);

        if (neighbor.x > object.x) {
            mesh.position.x = object.x * this.options.blockSize - (((object.x * this.options.blockSize) - (neighbor.x * this.options.blockSize)) / indent)
            
            if (decoration?.rotateByX) mesh.rotation.y = -decoration.rotateByX
            if (decoration?.moveFromCenter) mesh.position.z += decoration?.moveFromCenter;
        }

        if (neighbor.x < object.x) {
            mesh.position.x = object.x * this.options.blockSize - (((object.x * this.options.blockSize) - (neighbor.x * this.options.blockSize)) / indent)
            
            if (decoration?.rotateByX) mesh.rotation.y = decoration.rotateByX
            if (decoration?.moveFromCenter) mesh.position.z += decoration?.moveFromCenter;
        }

        if (neighbor.y > object.y) {
            mesh.position.z = (object.y * this.options.blockSize) - (((object.y * this.options.blockSize) - (neighbor.y * this.options.blockSize)) / indent);
            
            if (decoration?.moveFromCenter) mesh.position.x += decoration?.moveFromCenter;
        }

        if (neighbor.y < object.y) {
            mesh.position.z = (object.y * this.options.blockSize) - (((object.y * this.options.blockSize) - (neighbor.y * this.options.blockSize)) / indent);

            if (decoration?.moveFromCenter) mesh.position.x += decoration?.moveFromCenter;
            if (decoration?.rotateByZ) mesh.rotation.y = decoration.rotateByZ
        }
    }

    private seedDecorations(object: Record<string, any>) : void {
        for (const direction in object?.neighbours) {
            const neighbor = object?.neighbours?.[direction];
    
            if (neighbor?.type === 'floor' && (object.x === neighbor.x || object.y === neighbor.y)) {
                if (this.pillarCounter % 2 === 0) {
                    const pillar = this.options.pillarMesh.clone('pillar');

                    pillar.receiveShadows = true;
                    this.shadows.addShadowCaster(pillar);

                    this.placeMesh({ object, neighbor, decoration: { indent: 1.85, moveFromCenter: 5 }, mesh: pillar })
                }
                
                for (const decoration of this.options.decorMeshes) {
                    if (Math.random() > decoration.chance) continue;

                    const decorMesh = decoration.mesh.clone(decoration?.name);

                    decorMesh.receiveShadows = true;
                    this.shadows.addShadowCaster(decorMesh);

                    this.placeMesh({ object, neighbor, decoration, mesh: decorMesh })

                    if (decoration?.exclusive) break;
                }
            }
        }
    }

    public build() : Record<string, any> {
        const startPositions = [];

        for (const tile of this.dungeon.tiles) {
            for (const object of tile) {
              if (object.type === 'wall') {
                this.seedDecorations(object)
                const box = this.options.wallMesh.clone('wall');

                box.position.x = (object.x * this.options.blockSize);
                box.position.z = (object.y * this.options.blockSize);

                this.wallMeshes.push(box)
              };
          
              if (object.type === 'floor' || object.type === 'door') {
                startPositions.push(new Vector3(object.x * this.options.blockSize, 5, object.y * this.options.blockSize));

                const box = this.options.floorMesh.clone('floor');
                box.rotation.x = Math.PI / 2;
                box.position.y = -(this.options.blockSize / 2);
                box.position.x = object.x * this.options.blockSize;
                box.position.z = object.y * this.options.blockSize;
          
                const roof = this.options.floorMesh.clone('roof');
                roof.rotation.x = Math.PI / 2;
                roof.position.y = this.options.blockSize / 2;
                roof.position.x = object.x * this.options.blockSize;
                roof.position.z = object.y * this.options.blockSize;
          
                this.floorMeshes.push(box)
                this.wallMeshes.push(roof)
              }

              this.pillarCounter++
            }
        }

        const wallMesh = Mesh.MergeMeshes(this.wallMeshes);
        const floorMesh = Mesh.MergeMeshes(this.floorMeshes);

        return { startPositions, wallMesh, floorMesh }
    }
}