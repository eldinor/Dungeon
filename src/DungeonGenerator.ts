import { 
    Mesh, ShadowGenerator, SimplificationType, Vector3,
    MeshBuilder, AbstractMesh, Scene 
} from '@babylonjs/core';
import dungeoneer from 'dungeoneer'


type DungeonConstructor = {
    pillarMesh : Mesh,
    floorMesh  : Mesh,
    wallMesh   : Mesh,
    doorMesh   : Mesh,
    archMesh   : Mesh,
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
    private shadows : ShadowGenerator;
    private scene: Scene;
    private pillarCounter : number = 0;

    constructor(size: number, options : DungeonConstructor, shadows: ShadowGenerator, scene: Scene) {
        this.options = options;
        this.shadows = shadows;
        this.scene   = scene;
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
                    const pillar = this.options.pillarMesh.createInstance('pillar');

                    pillar.isOccluded = true;
                    pillar.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;
                    pillar.checkCollisions = true;

                    this.shadows.addShadowCaster(pillar);

                    this.placeMesh({ object, neighbor, decoration: { indent: 1.85, moveFromCenter: 5 }, mesh: pillar })

                    pillar.freezeWorldMatrix()
                }
                
                for (const decoration of this.options.decorMeshes) {
                    if (Math.random() > decoration.chance) continue;

                    const decorMesh = decoration.mesh.createInstance(decoration?.name);

                    decorMesh.isOccluded = true;
                    decorMesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;
                    
                    decorMesh.checkCollisions = true;
                    this.shadows.addShadowCaster(decorMesh);

                    this.placeMesh({ object, neighbor, decoration, mesh: decorMesh })

                    decorMesh.freezeWorldMatrix()

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
                if (!Object.values(object.neighbours).some(({ type } : any) => type === 'floor' || type === 'door')) continue;

                this.seedDecorations(object)
                const box = this.options.wallMesh.createInstance('wall');

                this.shadows.addShadowCaster(box);
                box.position.x = (object.x * this.options.blockSize);
                box.position.z = (object.y * this.options.blockSize);
                box.checkCollisions = true;
                
                box.freezeWorldMatrix()
              };

              if (object.type === 'door') {
                const arch = this.options.archMesh.createInstance('arch');
        
                arch.checkCollisions = true;
                arch.position.y = -(this.options.blockSize / 2.15);
                arch.position.x = (object.x * this.options.blockSize) + 4;
                arch.position.z = (object.y * this.options.blockSize) + 4;
                
                this.shadows.addShadowCaster(arch);

                if (object.neighbours?.n?.type === 'wall' && object.neighbours?.s?.type === 'wall') arch.rotation.y = -(Math.PI / 2)

                arch.freezeWorldMatrix()
              }
          
              if (object.type === 'floor' || object.type === 'door') {
                startPositions.push(new Vector3(object.x * this.options.blockSize, 2, object.y * this.options.blockSize));

                const box = this.options.floorMesh.createInstance('floor');
                box.rotation.x = Math.PI / 2;
                box.position.y = -(this.options.blockSize / 2);
                box.position.x = object.x * this.options.blockSize;
                box.position.z = object.y * this.options.blockSize;
                box.checkCollisions = true;
          
                const roof = this.options.floorMesh.createInstance('roof');
                roof.rotation.x = Math.PI / 2;
                roof.position.y = this.options.blockSize / 2;
                roof.position.x = object.x * this.options.blockSize;
                roof.position.z = object.y * this.options.blockSize;
                roof.checkCollisions = true;

                this.shadows.addShadowCaster(box);
                this.shadows.addShadowCaster(roof);

                box.freezeWorldMatrix()
                roof.freezeWorldMatrix()
              }

              this.pillarCounter++
            }
        }

        return { startPositions }
    }
}