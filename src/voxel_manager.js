const { AABB, CubeAABB } = require("./aabb.js");
const { Vector3 } = require("./vector.js");
const { HashSet, HashMap } = require('./hash_map.js');

class VoxelManager {

    constructor(voxelSize) {
        this._voxelSize = voxelSize;
        this.voxels = [];
        //this.triangleAABBs = [];
        //this.failedAABBs = [];

        this.minX = Infinity; // JavaScript crack
        this.minY = Infinity;
        this.minZ = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.maxZ = -Infinity;
        this.voxelsHash = new HashSet(2048);
    }

    /*
        Sending data to Web Workers serialise objects when sending messages
        between threads. This results in objects losing their functions and
        prototype. It is necessary to parse them into their correct class.
    */
    parseDummy(dummy) {
        this.minX = dummy.minX;
        this.minY = dummy.minY;
        this.minZ = dummy.minZ;
        this.maxX = dummy.maxX;
        this.maxY = dummy.maxY;
        this.maxZ = dummy.maxZ;

        // Copy .voxelsHash
        this.voxelsHash = new HashSet(2048);
        for (const dummyVector3s of dummy.voxelsHash.bins) {
            for (const dummyVector3 of dummyVector3s) {
                const vec = new Vector3(dummyVector3.x, dummyVector3.y, dummyVector3.z);
                this.voxelsHash.add(vec);
            }
        }

        // Copy .voxels
        const numVoxels = dummy.voxels.length;
        this.voxels = new Array(numVoxels);
        for (let i = 0; i < numVoxels; ++i) {
            const dummyVector3 = dummy.voxels[i];
            this.voxels[i] = new Vector3(dummyVector3.x, dummyVector3.y, dummyVector3.z);
        }
    }

    setVoxelSize(voxelSize) {
        this._voxelSize = voxelSize;
    }

    _clearVoxels() {
        this.voxels = [];
        //this.failedAABBs = [];
        
        this.minX = Infinity; // JavaScript crack
        this.minY = Infinity;
        this.minZ = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.maxZ = -Infinity;

        this.voxelsHash = new HashSet(2048);
    }

    clear() {
        //this.triangleAABBs = [];
        this._clearVoxels();
    }

    _getTriangleCubeAABB(triangle) {
        let gridSnappedCentre = Vector3.divScalar(triangle.aabb.centre, this._voxelSize);
        gridSnappedCentre = Vector3.round(gridSnappedCentre);
        gridSnappedCentre = Vector3.mulScalar(gridSnappedCentre, this._voxelSize);

        let width = this._voxelSize;
        //let cubeAABB = new AABB(gridSnappedCentre, new Vector3(size, size, size));
        let cubeAABB = new CubeAABB(gridSnappedCentre, width);

        while (!triangle.insideAABB(cubeAABB)) {
            //cubeAABB = new AABB(cubeAABB.centre, Vector3.mulScalar(cubeAABB.size, 2.0));
            cubeAABB = new CubeAABB(cubeAABB.centre, cubeAABB.width * 2.0);
        }

        return cubeAABB;
    }

    _voxelCentreToPosition(vec) {
        //Vector3.round(Vector3.subScalar(Vector3.divScalar(vec, this._voxelSize), 0.5));
        return new Vector3(
            Math.round(vec.x / this._voxelSize),
            Math.round(vec.y / this._voxelSize),
            Math.round(vec.z / this._voxelSize)
        );
    }

    _voxelPositionToCentre(vec) {
        return new Vector3(
            vec.x * this._voxelSize,
            vec.y * this._voxelSize,
            vec.z * this._voxelSize
        );
    }

    addVoxel(vec) {
        // (0.5, 0.5, 0.5) -> (0, 0, 0);
        vec = Vector3.subScalar(vec, this._voxelSize / 2);

        const pos = this._voxelCentreToPosition(vec);
        if (this.voxelsHash.contains(pos)) {
            return;
        }

        this.voxels.push(vec);
        this.voxelsHash.add(pos, true);

        this.minX = Math.min(this.minX, vec.x);
        this.minY = Math.min(this.minY, vec.y);
        this.minZ = Math.min(this.minZ, vec.z);
        this.maxX = Math.max(this.maxX, vec.x);
        this.maxY = Math.max(this.maxY, vec.y);
        this.maxZ = Math.max(this.maxZ, vec.z);
    }

    _findXExtent(pos) {
        let xEnd = pos.x + 1;

        while (this.voxelsHash.contains(new Vector3(xEnd, pos.y, pos.z)) && !this.seen.contains(new Vector3(xEnd, pos.y, pos.z))) {
            //console.log("Marking:", new Vector3(xEnd, y, z));
            this.seen.add(new Vector3(xEnd, pos.y, pos.z));
            ++xEnd;
        }

        return xEnd - 1;
    }

    _findZExtent(pos, xEnd) {
        let canMerge = true;
        let zEnd = pos.z + 1;

        do {
            //console.log("zEnd:", z, zEnd);
            for (let i = pos.x; i <= xEnd; ++i) {
                const here = new Vector3(i, pos.y, zEnd);
                if (!this.voxelsHash.contains(here) || this.seen.contains(here)) {
                    canMerge = false;
                    break;
                }
            }
            if (canMerge) {
                // Mark all as seen
                for (let i = pos.x; i <= xEnd; ++i) {
                    const here = new Vector3(i, pos.y, zEnd);
                    //console.log("Marking:", new Vector3(xEnd, y, z));
                    this.seen.add(here);
                }
                ++zEnd;
            }
        } while (canMerge);

        return zEnd - 1;
    }

    _findYExtent(pos, xEnd, zEnd) {
        let canMerge = true;
        let yEnd = pos.y + 1;

        do {
            for (let i = pos.x; i <= xEnd; ++i) {
                for (let j = pos.z; j <= zEnd; ++j) {
                    const here = new Vector3(i, yEnd, j);
                    if (!this.voxelsHash.contains(here) || this.seen.contains(here)) {
                        canMerge = false;
                        break;
                    }
                }
            }

            if (canMerge) {
                // Mark all as seen
                for (let i = pos.x; i <= xEnd; ++i) {
                    for (let j = pos.z; j <= zEnd; ++j) {
                        const here = new Vector3(i, yEnd, j);
                        this.seen.add(here);
                    }
                }
                ++yEnd;
            }
        } while (canMerge);

        return yEnd - 1;
    }

    buildMesh() {

        this.mesh = [];
        this.seen = new HashSet(2048);
        //console.log(this.voxelsHash);

        const minPos = this._voxelCentreToPosition(new Vector3(this.minX, this.minY, this.minZ));
        const maxPos = this._voxelCentreToPosition(new Vector3(this.maxX, this.maxY, this.maxZ));

        for (let y = minPos.y; y <= maxPos.y; ++y) {
            for (let z = minPos.z; z <= maxPos.z; ++z) {
                for (let x = minPos.x; x <= maxPos.x; ++x) {
                    
                    const pos = new Vector3(x, y, z);

                    if (this.seen.contains(pos) || !this.voxelsHash.contains(pos)) {
                        continue;
                    }

                    let xEnd = this._findXExtent(pos);
                    let zEnd = this._findZExtent(pos, xEnd);
                    let yEnd = this._findYExtent(pos, xEnd, zEnd);

                    let centre = new Vector3((xEnd + x)/2, (yEnd + y)/2, (zEnd + z)/2);
                    let size = new Vector3(xEnd - x + 1, yEnd - y + 1, zEnd - z + 1);

                    this.mesh.push({
                        centre: this._voxelPositionToCentre(centre),
                        size: this._voxelPositionToCentre(size)
                    });
                }
            }
        }

        //console.log("Mesh:", this.mesh);

        return this.mesh;
    }

    /*
    splitVoxels() {
        this._voxelSize /= 2;
        this._clearVoxels();
        
        const newTriangleAABBs = [];

        for (const {triangle, AABBs} of this.triangleAABBs) {
            const triangleAABBs = [];
            for (const AABB of AABBs) {
                for (const sub of AABB.subdivide()) {
                    if (triangle.intersectAABB(sub)) {
                        this.addVoxel(sub.centre);
                        triangleAABBs.push(sub);
                    }
                }
            }
            newTriangleAABBs.push({triangle: triangle, AABBs: triangleAABBs});
        }

        this.triangleAABBs = newTriangleAABBs;
    }
    */

    voxeliseTriangle(triangle) {
        const cubeAABB = this._getTriangleCubeAABB(triangle);

        //const triangleAABBs = [];

        let queue = [cubeAABB];
        while (queue.length > 0) {
            const aabb = queue.shift();
            if (triangle.intersectAABB(aabb)) {
                if (aabb.width > this._voxelSize) {
                    // Continue to subdivide
                    queue.push(...aabb.subdivide());
                } else {
                    // We've reached the voxel level, stop
                    this.addVoxel(aabb.centre);
                    //triangleAABBs.push(aabb);
                }
            }// else {
                //this.failedAABBs.push(aabb);
            //}
        }

        //this.triangleAABBs.push({triangle: triangle, AABBs: triangleAABBs});
    }

    voxeliseMesh(mesh) {
        for (const triangle of mesh.triangles) {
            this.voxeliseTriangle(triangle);
        }
    }

    setMesh(mesh) {
        this.mesh = mesh;
    }

    * voxeliseMeshGenerator() {
        const steps = 10;
        const numTriangles = this.mesh.triangles.length;
        console.log(numTriangles);
        const offset = Math.floor(numTriangles / steps);
        for (let step = 0; step < steps; step += 1) {
            for (let i = offset * step; i < offset * (step + 1); ++i) {
                this.voxeliseTriangle(this.mesh.triangles[i]);
            }
            yield (step + 1) / steps;
        }
        // Cleanup
        for (let i = offset * steps; i < numTriangles; ++i) {
            this.voxeliseTriangle(this.mesh.triangles[i]);
        }
        return;
    }

}

module.exports.VoxelManager = VoxelManager;