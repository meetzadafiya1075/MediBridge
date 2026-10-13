const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css'))
                results.push(file);
        }
    });
    return results;
}

const colorMap = {
    // Brand Greens -> Brand Reds
    '#065f46': '#dc2626',
    '#047857': '#b91c1c',
    '#059669': '#ef4444',
    '#0f766e': '#b91c1c',
    '#0d9488': '#991b1b', // Used in linear gradient in Referrals
    
    // Light Greens -> Light Reds
    '#ecfdf5': '#fef2f2',
    '#f0fdf4': '#fef2f2',
    
    // Border Mint Greens -> Border Light Reds
    '#a7f3d0': '#fecaca',
    '#bbf7d0': '#fecaca'
};

const regex = new RegExp(Object.keys(colorMap).join('|'), 'gi');

const files = walk(path.join(__dirname, 'frontend', 'src'));
for(let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Some exceptions logic
    // We do NOT want to change CheckCircle2 icon color in Dashboard/Referrals to red.
    // So we temporally mask it out.
    content = content.replace(/<CheckCircle2([^>]*?)color="\#059669"/g, '<CheckCircle2$1color="MASK_SUCCESS"');
    
    // Also Dashboard.css badge-success
    // We shouldn't change badge-success background to red.
    let isDashboardCss = file.endsWith('Dashboard.css');
    let isToastCss = file.endsWith('Toast.css');
    
    let newContent = content.replace(regex, (match) => {
        if(isDashboardCss || isToastCss) {
            // Keep green for success badges in Toast and Dashboard CSS
            return match; 
        }
        return colorMap[match.toLowerCase()] || match;
    });

    if(isDashboardCss) {
        // Manually replace dashboard grid lines, trends, etc while preserving success badge.
        // Actually badge-success uses #10b981 which isn't in colorMap! So it's safe.
        // Let's re-run normally on Dashboard.css
        newContent = content.replace(regex, (match) => colorMap[match.toLowerCase()] || match);
    }
    
    if(isToastCss) {
        // Toast has explicit #059669 for success toasts. Must not replace.
        // It has info, warning, error as well.
        // We will just skip Toast.css replacements for #059669 and #ecfdf5 because it uses them for success state.
        newContent = content.replace(regex, (match) => {
            if (match.toLowerCase() === '#059669' || match.toLowerCase() === '#ecfdf5') return match;
            return colorMap[match.toLowerCase()] || match;
        });
    }

    // Unmask
    newContent = newContent.replace(/MASK_SUCCESS/g, '#059669');

    if(content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated', file);
    }
}
