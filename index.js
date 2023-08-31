const inFile = document.getElementById('infile');
const message = document.getElementById('message');
const scores = document.getElementById('scores');
const charset = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                 '.', '-', '!', ' ', ' ', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var saveFile = [];

inFile.addEventListener('input', loadSave);
document.getElementById('savebutton').addEventListener('click', saveSaveFile);

async function loadSave(e) {
    scores.style.display = 'none';
    if (e.target.files[0].size != 512) {
        message.innerText = "Invalid save file";
        return;
    }
    message.innerText = '';
    saveFile = new Uint8Array(await e.target.files[0].arrayBuffer());
    parseSave();
}

async function parseSave() {
    let i = 0x36;
    for (let entry = 0; entry < 4; entry++) {
        let score = 0;
        let name = '';

        for (let r = 0; r < 4; r++) {
            let j = saveFile[i++] & 0x0F;
            let a = (saveFile[i++] & 0x0F) * 10 + j;
            score = score * 100 + a;
        }

        for (let r = 0; r < 7; r++) {
            let j = saveFile[i++] & 0x0F;
            let a = ((saveFile[i++] & 0x0F) << 4) + j;
            name += charset[a];
        }

        document.getElementById('name' + entry).value = name.trimEnd();
        document.getElementById('score' + entry).value = score;
    }
    scores.style.display = 'block';
}

function saveSaveFile() {
    let newSave = new Uint8Array(90);
    let i = 0;
    let padding = saveFile[0] & 0xF0;

    for (let entry = 0; entry < 4; entry++) {
        let score = document.getElementById('score' + entry).value.padStart(8, '0');
        let name = document.getElementById('name' + entry).value.toUpperCase().padEnd(7);

        for (let r = 0; r < 4; r++) {
            let b = score.slice(0,2);
            newSave[i++] = padding | Number.parseInt(b[1]);
            newSave[i++] = padding | Number.parseInt(b[0]);
            score = score.slice(2);
        }

        for (let r = 0; r < 7; r++) {
            let letter = charset.indexOf(name[r]);
            if (letter < 0) letter = 0x1D;
            newSave[i++] = padding | (letter & 0x0F);
            newSave[i++] = padding | ((letter & 0xF0) >> 4);
        }
    }

    let checksum = calculateCheckSum(newSave, 0x55, 88);
    newSave[i++] = padding | (checksum & 0x0F);
    newSave[i++] = padding | ((checksum & 0xF0) >> 4);

    for (let i = 0; i < newSave.length; i++) {
        saveFile[0x36 + i] = newSave[i];
    }

    let blob = new Blob([saveFile], {type: 'application/octet-stream'});
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = inFile.files[0].name;
    link.click();
    hexdump(saveFile);
}

function calculateCheckSum(array, start, length) {
    if (typeof length === 'undefined') {
        length = array.length;
    }
    let sum = start;
    for (let i = 0; i < length; i++) {
        sum = (sum + (array[i] & 0x0F)) % 0x100;
    }
    return sum;
}

function hexdump(array) {
    let i = 0;
    let mess = '           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n';
    for (let l = 0; l < Math.ceil(array.length / 16); l++) {
        let line = `${(l * 16).toString(16).padStart(8, '0')} | `;
        for (let j = 0; j < 16; j++) {
            line += array[i++].toString(16) + ' ';
            if (i >= array.length) break;
        }
        mess += line + '\n';
    }
    console.log(mess.toUpperCase());
}
