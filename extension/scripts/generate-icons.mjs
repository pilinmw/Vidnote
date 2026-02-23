/**
 * 生成扩展图标 PNG 文件
 * 使用 Node.js Canvas 模块
 * 如果没有安装 canvas 模块，请手动用浏览器打开 icon.svg 截图生成
 * 
 * 或者在浏览器控制台运行以下代码来生成：
 * 
 * async function generateIcons() {
 *   const sizes = [16, 32, 48, 128];
 *   const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
 *     <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
 *       <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
 *       <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
 *     </linearGradient></defs>
 *     <rect width="128" height="128" rx="28" fill="url(#grad)"/>
 *     <polygon points="48,36 48,92 96,64" fill="white" opacity="0.95"/>
 *     <rect x="24" y="96" width="56" height="6" rx="3" fill="white" opacity="0.7"/>
 *     <rect x="24" y="106" width="40" height="6" rx="3" fill="white" opacity="0.5"/>
 *   </svg>`;
 *   
 *   const blob = new Blob([svg], { type: 'image/svg+xml' });
 *   const url = URL.createObjectURL(blob);
 *   const img = new Image();
 *   img.src = url;
 *   await new Promise(r => img.onload = r);
 *   
 *   for (const size of sizes) {
 *     const canvas = document.createElement('canvas');
 *     canvas.width = size; canvas.height = size;
 *     const ctx = canvas.getContext('2d');
 *     ctx.drawImage(img, 0, 0, size, size);
 *     const a = document.createElement('a');
 *     a.download = `icon-${size}.png`;
 *     a.href = canvas.toDataURL('image/png');
 *     a.click();
 *   }
 * }
 * generateIcons();
 */

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const s = size / 128; // scale factor

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#3B82F6');

    // Rounded rect
    const r = 28 * s;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Play triangle
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(48 * s, 36 * s);
    ctx.lineTo(48 * s, 92 * s);
    ctx.lineTo(96 * s, 64 * s);
    ctx.closePath();
    ctx.fill();

    // Note lines
    ctx.globalAlpha = 0.7;
    roundRect(ctx, 24 * s, 96 * s, 56 * s, 6 * s, 3 * s);
    ctx.fill();

    ctx.globalAlpha = 0.5;
    roundRect(ctx, 24 * s, 106 * s, 40 * s, 6 * s, 3 * s);
    ctx.fill();

    const buffer = canvas.toBuffer('image/png');
    writeFileSync(`extension/icons/icon-${size}.png`, buffer);
    console.log(`Generated icon-${size}.png`);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
