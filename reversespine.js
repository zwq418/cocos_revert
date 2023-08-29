const fs = require('fs');
const path = require('path');
const UuidUtils = require('./uuidUtils');
const dirPath = path.resolve('.');

const inputPath = dirPath + '/input/';

function walkSync(dirPath, compare, callback) {
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach(file => {
        const filePath = path.join(dirPath, file.name);
        if (file.isFile()) {
            if (compare(file)) {
                callback(filePath);
            }
        } else if (file.isDirectory()) {
            walkSync(filePath, compare, callback)
        }
    })
}

const allFilePath = [];
walkSync(inputPath, file => {
    return path.extname(file.name) === '.json';
}, jsonPath => {
    allFilePath.push(jsonPath);
})

const spineFilePath = [];
function readFile() {
    allFilePath.forEach(path => {
        const fileContent = fs.readFileSync(path, 'utf-8');
        if (fileContent.includes('"skeleton"')) {
            parseSpineJson(JSON.parse(fileContent));
            spineFilePath.push(path);
        }
    })
}

const outputDir = dirPath + '/output/';
const outputSpineDir = outputDir + 'spine/';

function parseSpineJson(json) {
    const imageUUIDs = json[1];
    const spineName = json[5][0][1];
    const spineAtlas = json[5][0][2];
    const imageNames = json[5][0][3];
    const spineJson = json[5][0][4];
    const imageIndexs = json[5][0][5];

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    if (!fs.existsSync(outputSpineDir)) {
        fs.mkdirSync(outputSpineDir);
    }

    for (let i = 0; i < imageNames.length; i++) {
        outputImage(imageNames[i], imageUUIDs[imageIndexs[i]])
    }
    fs.writeFileSync(outputSpineDir + spineName + '.atlas', spineAtlas);
    fs.writeFileSync(outputSpineDir + spineName + '.json', JSON.stringify(spineJson));
}

function outputImage(imageName, uuid) {
    const ext = path.extname(imageName);
    const u = UuidUtils.decompressUuid(uuid);
    walkSync(inputPath, file => file.name === u + ext, path => {
        fs.copyFileSync(path, outputSpineDir + imageName);
    })
}

readFile();