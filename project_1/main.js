// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    /* Calculate rectangle of intersection */
    // Bounds Check
    // If positioned too far to the left, we're done
    if(fgPos.x + fgImg.width < 0) { return; }
    // If positioned too far to the right, we're done
    if(fgPos.x > bgImg.width) { return; }
    // If positioned too far to the top, we're done
    if(fgPos.y + fgImg.height < 0) { return; }
    // If positioned too far to the bottom, we're done
    if(fgPos.y > bgImg.height) { return; }
 
    // Calculate upper-left corner to begin at; clip to (0,0)
    let ul = { 
        x: fgPos.x < 0 ? 0 : fgPos.x,
        y: fgPos.y < 0 ? 0 : fgPos.y
    };
    // Calculate bottom-right corner; clip to bgImg bottom right corner coordinates.
    let br = {
        x: (fgPos.x + fgImg.width)  < (bgImg.width)  ? (fgPos.x + fgImg.width)  : bgImg.width,
        y: (fgPos.y + fgImg.height) < (bgImg.height) ? (fgPos.y + fgImg.height) : bgImg.height
    };
    let rect = { ul, br, width: br.x - ul.x, height: br.y - ul.y };

    // Calculate the fgImg (x,y) offsets (the bgImg offset is equiv to 'ul')
    rect.fgos = {
        x: fgPos.x < 0 ? Math.abs(fgPos.x) : 0,
        y: fgPos.y < 0 ? Math.abs(fgPos.y) : 0
    };

    // For intersection height (each row)
    for(y = 0; y < rect.height; y++) {
        // For intersection width (each pixel in the row)
        for( x = 0; x < rect.width; x++) {
            // Calculate the index of the bgImg
            let bgx = (rect.ul.x + x);
            let bgy = (rect.ul.y + y);
            let bgi = ((bgy * bgImg.width) + bgx) * 4 // Bytes per pixel

            // Calculate the index of fgImg
            let fgx = (rect.fgos.x + x);
            let fgy = (rect.fgos.y + y);
            let fgi = ((fgy * fgImg.width) + fgx) * 4 // Bytes per pixel

            // Grab Color Data; normalize to float[0,1] from Uint8 [0,255]
            let fgc = { 
                r: fgImg.data[fgi]     / 255,
                g: fgImg.data[fgi + 1] / 255,
                b: fgImg.data[fgi + 2] / 255,
                a: fgImg.data[fgi + 3] / 255
            };
            let bgc = { 
                r: bgImg.data[bgi]     / 255,
                g: bgImg.data[bgi + 1] / 255,
                b: bgImg.data[bgi + 2] / 255,
                a: bgImg.data[bgi + 3] / 255
            };

            // Calculate alpha term
            let na = fgOpac * fgc.a;
            let alpha = na + (1 - na) * bgc.a; 

            // Blend bg & fg and save result to bgImg
            bgImg.data[bgi]     = Math.round((((fgc.r * na) + ((1 - na) * bgc.r * bgc.a)) / alpha) * 255);
            bgImg.data[bgi + 1] = Math.round((((fgc.g * na) + ((1 - na) * bgc.g * bgc.a)) / alpha) * 255);
            bgImg.data[bgi + 2] = Math.round((((fgc.b * na) + ((1 - na) * bgc.b * bgc.a)) / alpha) * 255);
            bgImg.data[bgi + 3] = Math.round(alpha * 255);
        }
    }
}
