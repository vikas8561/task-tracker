const fs = require('fs');
const path = './src/index.css';
let css = fs.readFileSync(path, 'utf8');

// Replace Cyan (#00f0ff and 0, 240, 255) with Vibrant Rose (#ff3366 and 255, 51, 102)
css = css.replace(/#00f0ff/g, '#ff3366');
css = css.replace(/0,\s*240,\s*255/g, '255, 51, 102');

// Replace Purple (#8a2be2 and 138, 43, 226) with Neon Gold (#ffaa00 and 255, 170, 0)
css = css.replace(/#8a2be2/g, '#ffaa00');
css = css.replace(/138,\s*43,\s*226/g, '255, 170, 0');

// Replace Magenta (#ff00ff and 255, 0, 255) with Electric Violet (#9d4edd and 157, 78, 221)
css = css.replace(/#ff00ff/g, '#9d4edd');
css = css.replace(/255,\s*0,\s*255/g, '157, 78, 221');

fs.writeFileSync(path, css);
console.log('Colors replaced successfully!');
