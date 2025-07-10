// services/audit.service.js
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../data');
const CSV_HEADER = 'timestamp,realtedId,actionType,actionStatus\n';

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getLogFilePath = () => {
    return path.join(LOG_DIR, 'audit_log.csv');
};

const initializeCSV = () => {
    const csvPath = getLogFilePath();
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, CSV_HEADER);
    }
};

const logAdminAction = async (req, actionData) => {
    try {
        initializeCSV();

        const logEntry = {
            timestamp: new Date().toISOString(),
            actionData: actionData.id,
            actionType: actionData.type,
            actionStatus: actionData.status,
        };

        const csvLine = Object.values(logEntry)
            .map(value => `"${String(value).replace(/"/g, '""')}"`)
            .join(',') + '\n';

        fs.appendFileSync(getLogFilePath(), csvLine, 'utf8');

        console.log('Log record:', logEntry.actionType);

    } catch (error) {
        console.error('log fail:', {
            message: error.message,
            stack: error.stack
        });
    }
};

module.exports = { logAdminAction };