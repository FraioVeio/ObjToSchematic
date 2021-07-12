const { VoxelManager } = require('./voxel_manager.js');
const { Triangle } = require('./triangle.js');
const { Vector3 } = require('./vector.js');
const { Mesh } = require('./mesh.js');

self.onmessage = ({ data }) => {
    const voxelSize = data.voxelSize;
    const meshDummy = data.mesh;

    const mesh = new Mesh();
    mesh.parseDummy(meshDummy);
    
    const voxelManager = new VoxelManager(voxelSize);
    voxelManager.setMesh(mesh);

    //voxelManager.voxeliseMeshGenerator().next();
    //self.postMessage(0.5);
    //voxelManager.voxeliseMeshGenerator().next();
    const gen = voxelManager.voxeliseMeshGenerator();
    let isDone = false;
    do {
        const progress = gen.next();
        isDone = progress.done;
        if (!isDone) {
            self.postMessage({progress: progress.value});
        }
    } while (!isDone);

    self.postMessage({payload: voxelManager});
};