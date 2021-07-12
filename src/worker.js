const { VoxelManager } = require('./voxel_manager.js');
const { Triangle } = require('./triangle.js');
const { Vector3 } = require('./vector.js');
const { Mesh } = require('./mesh.js');

self.onmessage = (e) => {
    
    const trianglesBuffer = new Float32Array(e.data);
    console.log("Let's go");
    
    //const mesh = new Mesh();
    //mesh.parseDummy(meshDummy);
    
    const voxelSize = 0.1;
    const voxelManager = new VoxelManager(voxelSize);
    //voxelManager.voxeliseTrianglesBuffer(trianglesBuffer);

    const generator = voxelManager.voxeliseTrianglesBufferGenerator(trianglesBuffer);
    let isDone = false;
    do {
        const progress = generator.next();
        isDone = progress.done;
        if (!isDone) {
            self.postMessage({progress: progress.value});
        }
    } while (!isDone);

    const voxelsBuffer = voxelManager.buildVoxelsBuffer().buffer;
    self.postMessage(voxelsBuffer, [voxelsBuffer]);
};