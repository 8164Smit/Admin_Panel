const fs = require('fs');
const path = require('path');

const deleteImage = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '../public/uploads', filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete image: ${filename}`, err);
    });
  }
};

module.exports = deleteImage;
