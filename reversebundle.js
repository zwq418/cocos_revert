const fs = require('fs');
const path = require('path');
const UuidUtils = require('./uuidUtils');
const dirExists = require('./dir');
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
    return file.name === 'config.json';
}, jsonPath => {
    allFilePath.push(jsonPath);
})

const spineFilePath = [];
function readFile() {
    allFilePath.forEach(path => {
        const fileContent = fs.readFileSync(path, 'utf-8');
        parseConfigJson(JSON.parse(fileContent));
        spineFilePath.push(path);
    })
}

const outputDir = dirPath + '/output/';
const outputResourcesDir = outputDir + 'resources/';

const EXT_MAP = {
    "cc.JsonAsset": ".json",
    "cc.Texture2D": ".png",
    "cc.SpriteFrame": ".png",
    "cc.SpriteAtlas": ".unknown",
    "cc.Prefab": ".prefab",
    "cc.AudioClip": ".mp3",
    "sp.SkeletonData": ".json",
    "cc.Asset": ".unknown"
}

const VALIDA_TYPES = [0, 1, 2, 5];
const resourcesFiles = [];

function parseConfigJson(json) {

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    if (!fs.existsSync(outputResourcesDir)) {
        fs.mkdirSync(outputResourcesDir);
    }

    const { paths, types, uuids } = json;
    const indexs = Object.getOwnPropertyNames(paths);
    for (let i = 0; i < indexs.length; i++) {
        const order = indexs[i];
        const [ path, type] = paths[order];
        if (VALIDA_TYPES.includes(type)) {
            const ext = EXT_MAP[types[type]];
            const uuid = uuids[order];
            outputImage(path + ext, uuid);
        }
    }
}

function outputImage(imageName, uuid) {
    const ext = path.extname(imageName);
    const u = UuidUtils.decompressUuid(uuid);
    walkSync(inputPath, file => file.name === u + ext, async filePath => {
        resourcesFiles.push([filePath, outputResourcesDir + imageName]);
    })
}

async function copyFiles() {
    for (let i = 0; i < resourcesFiles.length; i++) {
        const [fromFile, toFile] = resourcesFiles[i];
        const fileArray = toFile.split('/');
        fileArray.pop();
        await dirExists(fileArray.join('/'));
        fs.copyFileSync(fromFile, toFile);
    }
}

readFile();
console.log(resourcesFiles)
copyFiles();
