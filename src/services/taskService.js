import { query } from "../db.js";

// Fetch all Tasks
export const getTask = async () => {
    const { rows } = await query("SELECT * FROM task_document_tbl ORDER BY td_id");
    return rows;
};

// NEW: Fetch only tasks that are NOT completed (pending / null / any status other than 'Completed')
// This will be used by the mobile Active Tasks screen.
export const getPendingTasks = async () => {
    const { rows } = await query(`
        SELECT *
        FROM task_document_tbl
        WHERE td_status IS NULL OR LOWER(td_status) <> 'completed'
        ORDER BY td_due_date ASC NULLS LAST, td_id ASC
    `);
    return rows;
};

// NEW: Fetch only completed tasks (status exactly 'Completed' case-insensitive)
// Used by the mobile Completed Tasks screen.
export const getCompletedTasks = async () => {
    const { rows } = await query(`
        SELECT *
        FROM task_document_tbl
        WHERE LOWER(COALESCE(td_status, '')) = 'completed'
        ORDER BY td_date_completed DESC NULLS LAST, td_id DESC
    `);
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

    // NOTE: Removed stray trailing comma after td_date_completed in column list to avoid SQL syntax error
    const { rows } = await query(
        'INSERT INTO task_document_tbl (td_case_id, td_name, td_description, td_due_date, td_priority, td_doc_path, td_to, td_by, td_status, td_date_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
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

export const getTaskById = async (taskId) => {
    const { rows } = await query('SELECT * FROM task_document_tbl WHERE td_id = $1', [taskId]);
    if (!rows.length) throw new Error('Task not found');
    return rows[0];
};