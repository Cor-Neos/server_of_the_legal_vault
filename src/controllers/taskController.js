import * as taskService from '../services/taskService.js';
import path from 'path';
import fs from 'fs';
import { encryptFile, writeMetadata } from '../utils/encryption.js';
import { decryptToStream, readMetadata } from '../utils/encryption.js';
import bcrypt from 'bcrypt';

// Fetching all Tasks
export const getTask = async (req, res) => {
    try {
        const tasks = await taskService.getTask();
        // Augment with passwordProtected flag if metadata present
        const rootUpload = 'C:/Users/Khling/caps/uploads';
        const augmented = tasks.map(t => {
            try {
                if (t.td_doc_path) {
                    const relative = t.td_doc_path.replace('/uploads/', '');
                    const encryptedFullPath = path.join(rootUpload, relative);
                    const metaPath = encryptedFullPath + '.meta.json';
                    if (fs.existsSync(metaPath)) {
                        const meta = readMetadata(metaPath);
                        return { ...t, password_protected: !!meta.passwordProtected };
                    }
                }
            } catch (_) { /* ignore */ }
            return { ...t, password_protected: false };
        });
        res.status(200).json(augmented);
    } catch (err) {
        console.error("Error fetching tasks", err);
        res.status(500).json({message: "Internal server error"});
    }
}

// Creating a new Task
export const createTask = async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            td_doc_path: req.file ? `/uploads/${req.file.filename}`: null,
        }
        const newTask = await taskService.createTask(taskData);
        res.status(201).json(newTask);
    } catch (err) {
        console.error("Error creating task", err);
        res.status(500).json({message: "Failed to create task"});
    }
};

//Upload document
export const uploadDocument = async (req, res) => {
    try {
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;
        if (!filePath) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const uploadedDocument = await taskService.uploadDocument(filePath);
        res.status(201).json(uploadedDocument);
    } catch (err) {
        console.error("Error uploading document", err);
        res.status(500).json({ message: "Failed to upload document" });
    }
}

// Handle task attachment uploads
export const uploadTaskAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const taskId = req.body.taskId;
        if (!taskId) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        // Paths setup
        const rawUploadDir = path.dirname(req.file.path); // existing disk storage path
        const encryptedDir = path.join(rawUploadDir, 'encrypted');
        if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir, { recursive: true });

        const encryptedFilename = req.file.filename + '.enc';
        const encryptedFullPath = path.join(encryptedDir, encryptedFilename);
        const metadataPath = encryptedFullPath + '.meta.json';

        // Encrypt the uploaded file into encrypted directory
        const meta = await encryptFile({ srcPath: req.file.path, destPath: encryptedFullPath });

        // Optional password protection
        let passwordHash = null;
        if (req.body.password && req.body.password.trim().length > 0) {
            try {
                passwordHash = await bcrypt.hash(req.body.password.trim(), 12);
            } catch (e) {
                console.error('Password hash error:', e);
            }
        }

        // Persist metadata
        writeMetadata(metadataPath, {
            original: req.file.originalname,
            stored: encryptedFilename,
            mime: req.file.mimetype,
            size: meta.size,
            uploadedAt: new Date().toISOString(),
            taskId,
            iv: meta.iv,
            tag: meta.tag,
            encKey: meta.encKey,
            wrapIV: meta.wrapIV,
            wrapTag: meta.wrapTag,
            checksum: meta.checksum,
            passwordProtected: !!passwordHash,
            passwordHash
        });

        // Optionally delete original plaintext file after encryption
        try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }

        const storedPath = `/uploads/tasks/encrypted/${encryptedFilename}`; // logical path
        const currentDate = new Date().toISOString();
        await taskService.updateTaskAttachment(taskId, storedPath, 'Completed', currentDate);

        res.status(200).json({
            message: "File uploaded & encrypted successfully",
            filePath: storedPath,
            filename: encryptedFilename,
            td_status: 'Completed',
            td_date_completed: currentDate,
            passwordProtected: !!passwordHash
        });
    } catch (err) {
        console.error("Error uploading task attachment (encryption phase):", err);
        res.status(500).json({ message: "Failed to upload task attachment" });
    }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId, status, completionDate } = req.body;
        
        if (!taskId || !status) {
            return res.status(400).json({ message: "Task ID and status are required" });
        }

        const updatedTask = await taskService.updateTaskStatus(
            taskId, 
            status, 
            status === 'Completed' ? (completionDate || new Date().toISOString()) : null
        );

        res.status(200).json(updatedTask);
    } catch (err) {
        console.error("Error updating task status:", err);
        res.status(500).json({ message: "Failed to update task status" });
    }
}

// Decrypt & download task attachment
export const downloadTaskAttachment = async (req, res) => {
    try {
        const { td_doc_path } = await taskService.getTaskById(req.params.taskId);
        if (!td_doc_path) return res.status(404).json({ message: 'No attachment' });
        // Map logical path to physical encrypted file
        // Expected logical: /uploads/encrypted/<filename>.enc
        const rootUpload = 'C:/Users/Khling/caps/uploads';
        const relative = td_doc_path.replace('/uploads/', '');
        const encryptedFullPath = path.join(rootUpload, relative);
        const metaPath = encryptedFullPath + '.meta.json';
        if (!fs.existsSync(encryptedFullPath) || !fs.existsSync(metaPath)) {
            return res.status(404).json({ message: 'Encrypted file or metadata missing' });
        }
        const meta = readMetadata(metaPath);
        if (meta.passwordProtected) {
            const provided = req.query.password || req.headers['x-doc-password'];
            if (!provided) return res.status(401).json({ message: 'Password required' });
            const ok = await bcrypt.compare(provided, meta.passwordHash || '');
            if (!ok) return res.status(403).json({ message: 'Invalid password' });
        }
        res.setHeader('Content-Type', meta.mime || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${meta.original || 'document'}"`);
        await decryptToStream({ encryptedPath: encryptedFullPath, metadata: meta, writable: res });
    } catch (err) {
        console.error('Error downloading attachment:', err);
        return res.status(500).json({ message: 'Failed to decrypt or stream attachment' });
    }
};

// NEW: Return only pending (non-completed) tasks
export const getPendingTasks = async (req, res) => {
    try {
        const tasks = await taskService.getPendingTasks();
        res.status(200).json(tasks);
    } catch (err) {
        console.error('Error fetching pending tasks', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// NEW: Return only completed tasks
export const getCompletedTasks = async (req, res) => {
    try {
        const tasks = await taskService.getCompletedTasks();
        res.status(200).json(tasks);
    } catch (err) {
        console.error('Error fetching completed tasks', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};