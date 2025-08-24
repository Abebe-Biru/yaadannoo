// Quick Icon Generator - Run this in browser console or as a script
function createBasicIcon(size = 192) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw white letter 'Y'
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Y', size / 2, size / 2);
    
    return canvas;
}

function downloadIcon(size) {
    const canvas = createBasicIcon(size);
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `icon-${size}x${size}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

// Generate all required icons
function generateAllIcons() {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    sizes.forEach((size, index) => {
        setTimeout(() => downloadIcon(size), index * 500);
    });
}

// Auto-run if in browser
if (typeof document !== 'undefined') {
    console.log('Icon generator loaded. Run generateAllIcons() to create all icons.');
}