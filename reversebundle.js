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

const configPaths = [];
walkSync(inputPath, file => {
    return file.name === 'config.json';
}, jsonPath => {
    configPaths.push(jsonPath);
})

async function parseConfigs() {
    let resourcesFiles = [];
    for (let i = 0; i < configPaths.length; i++) {
        const path = configPaths[i];
        const fileContent = fs.readFileSync(path, 'utf-8');
        const dirs = path.split('/');
        const files = await parseBundleConfigJson(dirs[dirs.length - 2], JSON.parse(fileContent));
        resourcesFiles = resourcesFiles.concat(files);
    }
    configPaths.forEach(async path => {
        const dirs = path.split('/');
        await copyOtherFiles(dirs[dirs.length - 2], resourcesFiles);
    })

}

const outputDir = dirPath + '/output/';

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

async function parseBundleConfigJson(bundle, json) {

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    const outputResourcesDir = outputDir + bundle + '/';
    if (!fs.existsSync(outputResourcesDir)) {
        fs.mkdirSync(outputResourcesDir);
    }

    const { paths, types, uuids } = json;
    const indexs = Object.getOwnPropertyNames(paths);
    const resourcesFiles = [];
    for (let i = 0; i < indexs.length; i++) {
        const order = indexs[i];
        const [ path, type] = paths[order];
        outputFile(outputResourcesDir + path + EXT_MAP[types[type]], uuids[order], resourcesFiles);
    }
    await copyFiles(resourcesFiles);
    return resourcesFiles;
}

function outputFile(targetFilePath, uuid, resourcesFiles) {
    const ext = path.extname(targetFilePath);
    const u = UuidUtils.decompressUuid(uuid);
    walkSync(inputPath, file => file.name === u + ext, async filePath => {
        resourcesFiles.push([filePath, targetFilePath]);
    })
}

async function copyFiles(resourcesFiles) {
    for (let i = 0; i < resourcesFiles.length; i++) {
        const [fromFile, toFile] = resourcesFiles[i];
        const fileArray = toFile.split('/');
        fileArray.pop();
        await dirExists(fileArray.join('/'));
        fs.copyFileSync(fromFile, toFile);
    }
}

const EXCLUDE_EXTS = ['.js', '.json', '.plist'];
async function copyOtherFiles(bundle, resourcesFiles) {
    const extSet = new Set();
    const mainFiles = [];
    walkSync(inputPath + 'assets/' + bundle + '/', file => (
        !EXCLUDE_EXTS.includes(path.extname(file.name)) &&
        !resourcesFiles.find(([resourcePath]) => resourcePath.includes(file.name))
        ), async filePath => {
        const ext = path.extname(filePath).replace('.', '');
        extSet.add(ext);
        mainFiles.push(filePath);
    })
    const outputOtherDir = outputDir + bundle + '/';
    for (const ext of extSet) {
        if (ext) {
            const outDir = outputOtherDir + ext;
            await dirExists(outDir);
        }
    }
    for (const filePath of mainFiles) {
        const basename = path.basename(filePath);
        const outDir = outputOtherDir + path.extname(filePath).replace('.', '');
        fs.copyFileSync(filePath, outDir + '/' + basename);
    }
}

parseConfigs();