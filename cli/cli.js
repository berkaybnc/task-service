const { Command } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const program = new Command();
const API_URL = 'http://localhost:3000';
const TOKEN_PATH = path.join(__dirname, '.token');

// Helper to get token
function getToken() {
    if (fs.existsSync(TOKEN_PATH)) {
        return fs.readFileSync(TOKEN_PATH, 'utf8');
    }
    return null;
}

program
    .name('task-cli')
    .description('HW2 Microservices CLI Client')
    .version('1.0.0');

// LOGIN
program
    .command('login')
    .description('Login to the system')
    .argument('<username>', 'username')
    .argument('<password>', 'password')
    .action(async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { username, password });
            const token = response.data.token;
            fs.writeFileSync(TOKEN_PATH, token);
            console.log(chalk.green('✔ Successfully logged in! Token saved.'));
        } catch (error) {
            console.error(chalk.red('✖ Login failed:'), error.response?.data?.message || error.message);
        }
    });

// LIST TASKS
program
    .command('list')
    .description('List all tasks')
    .action(async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks`);
            const tasks = response.data;
            if (tasks.length === 0) {
                console.log(chalk.yellow('No tasks found.'));
                return;
            }
            console.log(chalk.blue.bold('\n--- Task List ---'));
            tasks.forEach(t => {
                const statusColor = t.status === 'done' ? chalk.green : (t.status === 'doing' ? chalk.yellow : chalk.white);
                console.log(`${chalk.gray(t.id.slice(0,8))} | ${chalk.white.bold(t.title)} [${statusColor(t.status)}]`);
            });
            console.log(chalk.blue.bold('-----------------\n'));
        } catch (error) {
            console.error(chalk.red('✖ Failed to fetch tasks:'), error.message);
        }
    });

// ADD TASK
program
    .command('add')
    .description('Add a new task')
    .argument('<title>', 'task title')
    .option('-d, --desc <description>', 'task description', '')
    .action(async (title, options) => {
        const token = getToken();
        if (!token) {
            console.log(chalk.red('⚠ You must login first!'));
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/tasks`, {
                title,
                description: options.desc,
                status: 'todo'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(chalk.green('✔ Task created:'), response.data.title);
        } catch (error) {
            console.error(chalk.red('✖ Failed to create task:'), error.response?.data?.message || error.message);
        }
    });

// DELETE TASK
program
    .command('delete')
    .description('Delete a task')
    .argument('<id>', 'task ID')
    .action(async (id) => {
        const token = getToken();
        if (!token) {
            console.log(chalk.red('⚠ You must login first!'));
            return;
        }
        try {
            await axios.delete(`${API_URL}/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(chalk.green('✔ Task deleted successfully.'));
        } catch (error) {
            console.error(chalk.red('✖ Failed to delete task:'), error.response?.data?.message || error.message);
        }
    });

program.parse();
