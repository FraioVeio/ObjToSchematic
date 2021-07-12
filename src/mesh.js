const fs = require('fs');
const wavefrontObjParser = require('wavefront-obj-parser');
const expandVertexData = require('expand-vertex-data');

const { Triangle } = require('./triangle.js');
const { Vector3 } = require("./vector.js");

class Mesh {

    loadObj(obj_path) {
        var wavefrontString = fs.readFileSync(obj_path).toString('utf8');
        var parsedJSON = wavefrontObjParser(wavefrontString);
        var expanded = expandVertexData(parsedJSON, {facesToTriangles: true});

        this._data = {
            position: expanded.positions,
            normal: expanded.normals,
            indices: expanded.positionIndices
        };

        this._getTriangles();
    }

    /*
        Sending data to Web Workers serialise objects when sending messages
        between threads. This results in objects losing their functions and
        prototype. It is necessary to parse them into their correct class.
    */
    parseDummy(dummy) {
        this._data = dummy._data;
        const numTriangles = dummy.triangles.length;
        this.triangles = new Array(numTriangles);
        for (let i = 0; i < numTriangles; ++i) {
            const triangleDummy = dummy.triangles[i];
            const v0 = new Vector3();
            const v1 = new Vector3();
            const v2 = new Vector3();
            v0.parseDummy(triangleDummy.v0);
            v1.parseDummy(triangleDummy.v1);
            v2.parseDummy(triangleDummy.v2);
            this.triangles[i] = new Triangle(v0, v1, v2);
        }
    }

    _getTriangles() {
        this.triangles = [];
        for (let i = 0; i < this._data.indices.length; i += 3) {
            let i0 = this._data.indices[i];
            let i1 = this._data.indices[i + 1];
            let i2 = this._data.indices[i + 2];

            let v0 = this._data.position.slice(3 * i0, 3 * i0 + 3);
            let v1 = this._data.position.slice(3 * i1, 3 * i1 + 3);
            let v2 = this._data.position.slice(3 * i2, 3 * i2 + 3);

            const v0_ = new Vector3(v0[0], v0[1], v0[2]);
            const v1_ = new Vector3(v1[0], v1[1], v1[2]);
            const v2_ = new Vector3(v2[0], v2[1], v2[2]);

            this.triangles.push(new Triangle(v0_, v1_, v2_));
        }
    }

}

module.exports.Mesh = Mesh;