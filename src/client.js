const { Renderer } = require('./src/renderer.js');
const { Mesh } = require('./src/mesh.js');
const { VoxelManager } = require('./src/voxel_manager.js');
const { Vector3 } = require('./src/vector.js');
const { Schematic } = require('./src/schematic.js');

const dialog = require('electron').remote.dialog;

const voxelSize = document.querySelector("#voxelInput").value;
let renderer = new Renderer(voxelSize);
const voxelManager = new VoxelManager(voxelSize);

const canvas = document.querySelector("#c");

let loadedMesh = null;



function showToastWithText(text, style) {
    $("#toast").removeClass("bg-success");
    $("#toast").removeClass("bg-warning");
    $("#toast").removeClass("bg-danger");
    $("#toast").addClass(`bg-${style}`);

    $("#toastText").html(text);
    $("#toast").toast('show');
}

// CHOOSE FILE
$("#loadBtn").on("click", () => {
    const files = $("#fileInput").prop("files");

    if (files.length != 1) {
        return;
    }

    const file = files[0];
    if (!file.name.endsWith(".obj") && !file.name.endsWith(".OBJ")) {
        showToastWithText(`Could not load ${file.name}`, 'danger');
        return;
    }

    try {
        loadedMesh = new Mesh();
        loadedMesh.loadObj(files[0].path);
    } catch (err) {
        showToastWithText(`Could not load ${file.name}`, 'danger');
        return;
    }
    
    renderer.clear();
    renderer.registerMesh(loadedMesh);
    renderer.compileRegister();

    $('#voxelInput').prop('disabled', false);
    $('#voxelBtn').prop('disabled', false);
    $('#splitBtn').prop('disabled', true);
    $('#exportBtn').prop('disabled', true);

    showToastWithText(`Successfully load ${file.name}`, 'success');
});


// VOXELISE BUTTON
$("#voxelBtn").on("click", () => {
    const voxelSize = Number($("#voxelInput").prop('value'));

    if (voxelSize < 0.001) {
        showToastWithText("Voxel size must be at least 0.001", 'danger');
        return;
    }
    
    
    
    const worker = new Worker("./src/worker.js");
    worker.postMessage({voxelSize: voxelSize, mesh: loadedMesh});
    worker.onmessage = ({ data }) => {

        if ('progress' in data) {
            console.log(`received ${data.progress}`);
            $('#progressBar').css("width", `${data.progress * 100}%`);
        } else if ('payload' in data) {
            console.log("received whole");
            voxelManager.parseDummy(data.payload);

            renderer.clear();
            renderer.setVoxelSize(voxelSize);
            renderer.registerVoxelMesh(voxelManager, false);
            renderer.compileRegister();

            $('#exportBtn').prop('disabled', false);
            //$('#splitBtn').prop('disabled', false);

            showToastWithText("Model successfully voxelised", 'success');
        } else {
            console.error("Oh shit");
        }
    };

});


var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});


$("#splitBtn").on("click", () => {
    const voxelSize = $("#voxelInput").prop('value');
    $("#voxelInput").prop('value', voxelSize / 2);

    voxelManager.splitVoxels();

    renderer.clear();
    renderer.setVoxelSize(voxelSize / 2);
    renderer.registerVoxelMesh(voxelManager, true);
    renderer.compileRegister();
});



// EXPORT SCHEMATIC
$("#exportBtn").on("click", async () => {

    const {filePath} = await dialog.showSaveDialog({
        title: "Save schematic",
        buttonLabel: "Save",
        filters: [{
            name: 'Schematic',
            extensions: ['schematic']
        }]
    });

    if (filePath === undefined) {
        return;
    }

    try {
        const schematic = new Schematic(voxelManager);
        schematic.exportSchematic(filePath);
    } catch (err) {
        showToastWithText("Failed to export schematic", false);
    }
    
    showToastWithText("Successfully saved schematic", true);
});


$(document).resize(function() {
    canvas.height = window.innerHeight - 55;
    canvas.width = window.innerWidth;
});

function render(time) {
    renderer.begin();
    renderer.end();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);