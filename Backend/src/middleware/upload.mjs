import multer from 'multer';
import path from 'path';
import fs from 'fs';


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname)  // Or custom naming
});

const ensureUploadDirExists = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
};
//delete image file when deleting a client
const imgFilePath = (filename) => {
    return path.join(process.cwd(), 'uploads', filename);
}
ensureUploadDirExists();



const upload = multer({ storage });

export default upload;