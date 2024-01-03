import { 
    Mesh, ShadowGenerator, SimplificationType, Vector3, RecastJSPlugin,
    MeshBuilder, AbstractMesh, Matrix, Quaternion, Scene, Animation, TransformNode
} from '@babylonjs/core';
import dungeoneer from 'dungeoneer'

type DungeonConstructor = {
    pillarMesh : Mesh,
    floorMesh  : Mesh,
    wallMesh   : Mesh,
    door       : { mesh: Mesh, positionAdjustment?: Vector3 },
    arch       : { mesh: Mesh, positionAdjustment?: Vector3 },
    blockSize  : number,
    decorMeshes : { 
        chance: number, 
        mesh: Mesh, 
        indent?: number, 
        name: string,
        exclusive? : boolean,
        scaling?: Vector3,
        isThin?: boolean,
        xAxis?: number,
        yAxis?: number,
        zAxis?: number,
        withShadow?: boolean,
        withCollision?: boolean,
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
    private pillarCounter : number = 0;
    private navigationMeshes : Mesh[] = [];

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

        const position = this.setPosition(object)

        mesh.position.x = decoration?.xAxis ? decoration?.xAxis : position.x;
        mesh.position.z = decoration?.zAxis ? decoration?.zAxis : position.z;
        mesh.position.y = decoration?.yAxis ? decoration?.yAxis : position.y;

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
            // if (decoration?.rotateByZ) mesh.rotation.y = -decoration.rotateByZ
        }

        if (neighbor.y < object.y) {
            mesh.position.z = (object.y * this.options.blockSize) - (((object.y * this.options.blockSize) - (neighbor.y * this.options.blockSize)) / indent);

            if (decoration?.moveFromCenter) mesh.position.x += decoration?.moveFromCenter;
            if (decoration?.rotateByZ) mesh.rotation.y = decoration.rotateByZ
        }
    }

    private placeThinMesh({ object, neighbor, decoration, mesh }: PlaceArgs) {
        const indent = decoration?.indent || Math.random() * 2;

        const translation = this.setPosition(object)

        const scaling = decoration?.scaling || Vector3.Zero()

        if (neighbor.x > object.x) {
            translation.x = object.x * this.options.blockSize - (((object.x * this.options.blockSize) - (neighbor.x * this.options.blockSize)) / indent)
            
            if (decoration?.moveFromCenter) translation.z += decoration?.moveFromCenter;
        }

        if (neighbor.x < object.x) {
            translation.x = object.x * this.options.blockSize - (((object.x * this.options.blockSize) - (neighbor.x * this.options.blockSize)) / indent)
            
            if (decoration?.moveFromCenter) translation.z += decoration?.moveFromCenter;
        }

        if (neighbor.y > object.y) {
            translation.z = (object.y * this.options.blockSize) - (((object.y * this.options.blockSize) - (neighbor.y * this.options.blockSize)) / indent);
            
            if (decoration?.moveFromCenter) translation.x += decoration?.moveFromCenter;
        }

        if (neighbor.y < object.y) {
            translation.z = (object.y * this.options.blockSize) - (((object.y * this.options.blockSize) - (neighbor.y * this.options.blockSize)) / indent);

            if (decoration?.moveFromCenter) translation.x += decoration?.moveFromCenter;
        }

        return mesh.thinInstanceAdd(Matrix.Compose(scaling, Quaternion.Identity(), translation))
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

                    if (decoration?.isThin) {
                        this.placeThinMesh({ object, neighbor, decoration, mesh: decoration.mesh });

                        if (decoration.withShadow) this.shadows.addShadowCaster(decoration.mesh);

                        continue;
                    }

                    const decorMesh = decoration.mesh.createInstance(decoration?.name);

                    decorMesh.isOccluded = true;
                    decorMesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT;
                    
                    if (decoration?.withCollision) decorMesh.checkCollisions = true;
                    if (decoration.withShadow) this.shadows.addShadowCaster(decorMesh);

                    this.placeMesh({ object, neighbor, decoration, mesh: decorMesh })

                    decorMesh.freezeWorldMatrix()

                    if (decoration?.exclusive) break;
                }
            }
        }
    }

    private setPosition(object: Record<string,any>) {
        return new Vector3(
            (object.x * (this.options.floorMesh._geometry._extend.maximum.x * 2)), 
            this.options.wallMesh._geometry._extend.minimum.y, 
            (object.y * (this.options.floorMesh._geometry._extend.maximum.y * 2))
        )
    }

    public build() : Record<string, any> {
        const startPositions = [];

        for (const tile of this.dungeon.tiles) {
            for (const object of tile) {
              if (object.type === 'wall') {
                if (!Object.values(object.neighbours).some(({ type } : any) => type === 'floor' || type === 'door')) continue;

                this.seedDecorations(object)
                const box = this.options.wallMesh.createInstance('wall');

                box.position = this.setPosition(object)
                box.position.y = this.options.wallMesh._geometry._extend.minimum.y + this.options.wallMesh._geometry._extend.maximum.y;
                box.checkCollisions = true;
                box.isOccluded = true;
                box.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT; 
                
                box.freezeWorldMatrix()
              };

              if (object.type === 'door') {
                const arch = this.options.arch.mesh.createInstance('arch');
                const door = this.options.door.mesh.clone('door');
        
                arch.checkCollisions = true;
                arch.position = this.setPosition(object).add(this.options.arch.positionAdjustment)

                arch.isOccluded = true;
                arch.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT; 

                door.isOccluded = true;
                door.occlusionType = AbstractMesh.OCCLUSION_TYPE_STRICT; 
                
                door.checkCollisions = true;
                door.position = this.setPosition(object).add(this.options.door.positionAdjustment)
                
                this.shadows.addShadowCaster(door)
                this.shadows.addShadowCaster(arch);

                if (object.neighbours?.n?.type === 'wall' && object.neighbours?.s?.type === 'wall') {
                    arch.rotation.y = -(Math.PI / 2)
                    door.rotation.y = -(Math.PI / 2)
                    door.position.x += 1
                    door.position.z -= 0.95
                }

                arch.freezeWorldMatrix()
                door.freezeWorldMatrix()
              }
          
              if (object.type === 'floor' || object.type === 'door') {
                startPositions.push(this.setPosition(object));

                const box = this.options.floorMesh.createInstance('floor');
                box.rotation.x = Math.PI / 2;
                box.position = this.setPosition(object)
                box.checkCollisions = true;

                this.navigationMeshes.push(box)
          
                const roof = this.options.floorMesh.createInstance('roof');
                roof.rotation.x = -(Math.PI / 2);
                roof.position = this.setPosition(object).add(new Vector3(0, this.options.wallMesh._geometry._extend.maximum.y * 2, 0))
                roof.checkCollisions = true;

                box.freezeWorldMatrix()
                roof.freezeWorldMatrix()
              }

              this.pillarCounter++
            }
        }

        return { navMeshes: this.navigationMeshes }
    }
}