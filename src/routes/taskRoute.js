import express from 'express';
import multer from 'multer';
import path from 'path';
import * as taskController from '../controllers/taskController.js';
import verifyUser from '../middleware/verifyUser.js';
import requireTaskCreator from '../middleware/requireTaskCreator.js';


const router = express.Router();

// Multer setup for documents uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "C:/Users/Khling/caps/uploads/tasks");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.round() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf",];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null, true);
    },
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

//Routes 
router.get('/tasks', verifyUser, taskController.getTask);
// NEW: granular task collections for mobile app
router.get('/tasks/pending', verifyUser, taskController.getPendingTasks); // returns tasks not yet completed
router.get('/tasks/completed', verifyUser, taskController.getCompletedTasks); // returns completed tasks only

router.put(
    '/tasks/:td_id', 
    verifyUser, 
    upload.single('td_doc_path'), 
    taskController.createTask
);

router.post(
    '/tasks', 
    verifyUser,
    requireTaskCreator, // Only Admin & Lawyer can create tasks
    upload.single('td_doc_path'),
    taskController.createTask
);

// New route for task attachments
router.post(
    '/tasks/upload',
    verifyUser,
    requireTaskCreator, // restrict upload (completing) to task creators roles
    upload.single('file'),
    taskController.uploadTaskAttachment
);

// Route to update task status
router.patch(
    '/tasks/:td_id/status',
    verifyUser,
    taskController.updateTaskStatus
);

// Download (decrypt) task attachment
router.get(
    '/tasks/:taskId/attachment',
    verifyUser,
    taskController.downloadTaskAttachment
);

export default router;