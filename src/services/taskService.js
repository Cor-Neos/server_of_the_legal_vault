import { query } from "../db.js";

// Fetch all Tasks
export const getTask = async () => {
    const { rows } = await query("SELECT * FROM task_document_tbl ORDER BY td_id");
    return rows;
};

export const createTask = async (taskData) => {
    const {
        td_case_id,
        td_name, 
        td_description, 
        td_due_date, 
        td_priority,
        td_doc_path,
        td_to,
        td_by,
        td_status,
        td_date_completed,
    } = taskData;

    const { rows } = await query(
        'INSERT INTO task_document_tbl (td_case_id, td_name, td_description, td_due_date, td_priority, td_doc_path, td_to, td_by, td_status, td_date_completed,) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [        
            td_case_id,
            td_name, 
            td_description, 
            td_due_date, 
            td_priority,
            td_doc_path,
            td_to,
            td_by,
            td_status,
            td_date_completed,
        ]
    );

    return rows[0];
};

export const uploadDocument = async (filePath) => {
    const { rows } = await query(
        'INSERT INTO task_document_tbl (td_doc_path) VALUES ($1) RETURNING *',
        [filePath]
    );
    return rows[0];
}

// Update task attachment
export const updateTaskAttachment = async (taskId, filePath, status, completionDate) => {
    const { rows } = await query(
        'UPDATE task_document_tbl SET td_doc_path = $1, td_status = $2, td_date_completed = $3, td_updated_at = CURRENT_TIMESTAMP WHERE td_id = $4 RETURNING *',
        [filePath, status, completionDate, taskId]
    );
    
    if (rows.length === 0) {
        throw new Error('Task not found');
    }
    
    return rows[0];
}

// Update task completion status
export const updateTaskStatus = async (taskId, status, completionDate = null) => {
    const { rows } = await query(
        'UPDATE task_document_tbl SET td_status = $1, td_date_completed = $2, td_updated_at = CURRENT_TIMESTAMP WHERE td_id = $3 RETURNING *',
        [status, completionDate, taskId]
    );
    
    if (rows.length === 0) {
        throw new Error('Task not found');
    }
    
    return rows[0];
}