import * as taskService from '../services/taskService.js';
import path from 'path';
import fs from 'fs';

// Fetching all Tasks
export const getTask = async (req, res) => {
    try {
        const tasks = await taskService.getTask();
        res.status(200).json(tasks);
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

        const filePath = `/uploads/${req.file.filename}`;
        const currentDate = new Date().toISOString();
        
        // Update the task with the new attachment path and mark as completed
        const updatedTask = await taskService.updateTaskAttachment(taskId, filePath, 'Completed', currentDate);

        res.status(200).json({
            message: "File uploaded successfully",
            filePath: filePath,
            filename: req.file.filename,
            td_status: 'Completed',
            td_date_completed: currentDate
        });
    } catch (err) {
        console.error("Error uploading task attachment:", err);
        res.status(500).json({ message: "Failed to upload task attachment" });
    }
}

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