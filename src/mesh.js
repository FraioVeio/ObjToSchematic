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

    _getTriangles() {
        this.triangles = [];
        this.trianglesBuffer = new Float32Array(this._data.indices.length * 3);
        let j = 0;
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

            this.trianglesBuffer[j + 0] = v0_.x;
            this.trianglesBuffer[j + 1] = v0_.y;
            this.trianglesBuffer[j + 2] = v0_.z;
            this.trianglesBuffer[j + 3] = v1_.x;
            this.trianglesBuffer[j + 4] = v1_.y;
            this.trianglesBuffer[j + 5] = v1_.z;
            this.trianglesBuffer[j + 6] = v2_.x;
            this.trianglesBuffer[j + 7] = v2_.y;
            this.trianglesBuffer[j + 8] = v2_.z;
            j += 9;
        }
    }



}

module.exports.Mesh = Mesh;