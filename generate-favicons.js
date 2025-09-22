const fs = require('fs');
const path = require('path');

// Simple favicon generator script
// This creates different sizes of the favicon for better browser support

const sizes = [16, 32, 48, 64, 128, 256];

console.log('Generating favicon sizes...');

// For now, just copy the main logo to different names
// In a real scenario, you'd want to resize the image
sizes.forEach(size => {
  const filename = `favicon-${size}x${size}.png`;
  try {
    fs.copyFileSync('public/beq-logo.png', `public/${filename}`);
    console.log(`Created ${filename}`);
  } catch (error) {
    console.error(`Error creating ${filename}:`, error.message);
  }
});

console.log('Favicon generation complete!');
