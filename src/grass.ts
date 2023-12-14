import { 
    Effect, Vector3, 
    Scene, Mesh, Engine,
    ShaderMaterial, VertexData,
    NoiseProceduralTexture, TransformNode,
    ISize
} from "@babylonjs/core";

import shaders from "./shaders";

export default class Grass {
    private scene : Scene;
    private args : Record<string, any>;
    private paths : Vector3[][];
    private density : number;
    private engine : Engine;
    private wind : NoiseProceduralTexture;
    private windViewer : ShaderMaterial;
    private grassMat : ShaderMaterial;
    private grassDensity : NoiseProceduralTexture;
    private time : number = 0.0;

    constructor(paths: Vector3[][], density: number, scene: Scene, engine: Engine, args: Record<string, any> = {
        bladeSegments: 4,
        bladesPerClump: 10,
        bladeLength: 2,
        doubleBlade: true,
        clumpSplay: 0.12,
        clumpSpread: 2.5
    },) {
        this.scene = scene;
        this.paths = paths;
        this.density = density;
        this.args = args;
        this.engine = engine;


        for (let shader in shaders) {
            Effect.ShadersStore[shader] = shaders[shader]
        }

        this.wind = new NoiseProceduralTexture("wind", 16, this.scene)
        this.wind.octaves = 5;
        this.wind.animationSpeedFactor = 2.5;
        this.wind.refreshRate = 2;
        this.wind.persistence = 0.5;

        this.windViewer = new ShaderMaterial("windViewerMat", this.scene, 
            {
                vertex: "windV",
                fragment: "windV",
            },
            {
                attributes: ["position", "normal", "uv", "height", "trans0", "trans1", "trans2", "trans3"],
                uniforms: ["worldViewProjection", "windSampler", "time", "windSize", "onePx"],
            }
        );

        this.windViewer.setTexture("windSampler", this.wind);
        this.windViewer.setFloat("windSize", this.paths?.length);
        this.windViewer.setFloat("onePx", 1 / this.wind.getSize().width);
        this.windViewer.setFloat("time", this.time);
        this.windViewer.backFaceCulling = false;


        this.grassMat = new ShaderMaterial("grassMat", this.scene, 
            {
                vertex: "grass",
                fragment: "grass",
            },
            {
                attributes: ["position", "normal", "uv", "height", "world"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "windSampler", "time", "windSize", "onePx", "windStrength"]
            }
        );

        this.grassMat.setTexture("windSampler", this.wind);
        this.grassMat.setFloat("windSize", this.paths?.length);
        this.grassMat.setFloat("windStrength", 1);
        this.grassMat.setFloat("onePx", 1 / this.wind.getSize().width);
        this.grassMat.setFloat("time", this.time);
        this.grassMat.backFaceCulling = false;


        this.grassDensity = new NoiseProceduralTexture("density", 1, this.scene);
        this.grassDensity.octaves = 4;
        this.grassDensity.animationSpeedFactor = 0;
        this.grassDensity.refreshRate = 0;
        this.grassDensity.onGenerated = () => {
            (this.grassDensity as any).readPixels().then((e: any) => {
                this.placeGrass(e, this.grassDensity.getSize());
            })
        };

        this.scene.registerAfterRender(() =>{
            this.time += this.engine.getDeltaTime() * 0.001;
            this.grassMat.setFloat("time", this.time);
            this.windViewer.setFloat("time", this.time);
        });
    }

    private placeGrass(pixles: number[], imgSize: ISize){
    
        const blades = [];

        for(let i = 0; i < this.args.bladesPerClump; i++){
            
            const blade = this.createGrassBlade();

            blade.rotate(Vector3.Up(), 2 * Math.random() * Math.PI);
            blade.position.x += (Math.random() - 0.5) * this.args.clumpSpread;
            blade.position.z += (Math.random() - 0.5) * this.args.clumpSpread;
            blades.push(blade);
        }

        const bladeMesh : Mesh | null = Mesh.MergeMeshes(blades, true);
        const placer = new TransformNode('placer');
    
        if (bladeMesh) bladeMesh.thinInstanceRegisterAttribute("height", 1);

        const numBlades = (this.paths?.length * this.paths?.length) * this.density;
    
        const bufferMatrices = new Float32Array(16 * numBlades);
        const bufferHeights = new Float32Array(numBlades);

    
        let index = 0;

        for (let i = 0; i < this.paths?.length; i++) {
            for (let y = 0; y < this.paths[i]?.length; y++) {
                for (let density = 0; density < this.density; density++) {
                    const uvx = Math.random();
                    const uvy = Math.random();
                    const color = this.getPixel(pixles, uvx * imgSize.width, uvy * imgSize.width, imgSize);

                    placer.position.x = this.paths[i][y].x + uvx;
                    placer.position.z = this.paths[i][y].z + uvy;
                    placer.position.y = this.paths[i][y]?.y - 0.1;
                    placer.rotate(Vector3.Up(), 2 * Math.random() * Math.PI);
                    const height = this.mapRange(color.r, 0, 255, 0.6, 1.5);
                    placer.computeWorldMatrix(true).copyToArray(bufferMatrices, index * 16);
                    bufferHeights[index] = height * this.args.bladeLength;
                    index++;
                }
            }
        }

        if (bladeMesh) {
            bladeMesh.thinInstanceSetBuffer("matrix", bufferMatrices, 16, true);
            bladeMesh.thinInstanceSetBuffer("height", bufferHeights, 1, true);
        }
    }

    private mapRange(value: number, lowIn: number, heighIn: number, lowOut: number, heighOut: number){
        return (value-lowIn) / (heighIn-lowIn) * (heighOut-lowOut) + lowOut;
    }

    private getPixel(pixels: number[], px: number, py: number, imagSize: ISize){
        const xPixel = Math.floor(px);
        const yPixel = Math.floor(py);
    
        const width = imagSize.width ?? (imagSize as any).x ?? imagSize;
        const pixelIndex = xPixel + yPixel * width;

        return {
            r: pixels[pixelIndex*4],
            g: pixels[pixelIndex*4+1],
            b: pixels[pixelIndex*4+2],
            a: pixels[pixelIndex*4+3]
        };
    }

    public createGrassBlade(){
        const bladeMesh = new Mesh("bladeMesh", this.scene);
        bladeMesh.material = this.grassMat;
        const vertexData3 = new VertexData();
        const vertexes = this.args.bladeSegments;
        const length = 0.5;
        const segmentLength = length/vertexes;
        const bladeWidth = 0.07;
        const bend = this.args.clumpSplay;
    
        vertexData3.positions = [];
        vertexData3.indices = [];

        for(let i = 0; i < vertexes; i++){
            vertexData3.positions.push(-bladeWidth/2);
            vertexData3.positions.push(i*segmentLength);
            vertexData3.positions.push(bend*i);
    
            vertexData3.positions.push(bladeWidth/2);
            vertexData3.positions.push(i*segmentLength);
            vertexData3.positions.push(bend*i);
    
            if(i > 0){
                vertexData3.indices.push(2*(i-1));
                vertexData3.indices.push(2*i);
                vertexData3.indices.push(2*(i)+1);
    
                vertexData3.indices.push(2*(i-1));
                vertexData3.indices.push(2*(i)+1);
                vertexData3.indices.push(2*(i-1)+1);
            }
            
        }

        vertexData3.positions.push(0);
        vertexData3.positions.push(vertexes*segmentLength);
        vertexData3.positions.push(bend*vertexes);
    
        vertexData3.indices.push(vertexes*2-2);
        vertexData3.indices.push(vertexes*2);
        vertexData3.indices.push(vertexes*2-1);
    
        if(this.args.doubleBlade){
            vertexData3.positions.push(bladeWidth, vertexes*segmentLength*0.5, -bladeWidth*2);
    
            vertexData3.indices.push(0);
            vertexData3.indices.push(vertexData3.positions.length/3-1);
            vertexData3.indices.push(1);
        }

        vertexData3.applyToMesh(bladeMesh);
    
        return bladeMesh;
    }
}