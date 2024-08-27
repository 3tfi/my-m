// Event listener to load state when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadState();
});

// Show/hide options menu when plus button is clicked
document.getElementById('plusButton').addEventListener('click', () => {
    const options = document.getElementById('options');
    options.classList.toggle('hidden');
});

// Add event listeners to options buttons
document.querySelectorAll('#options button').forEach(button => {
    button.addEventListener('click', () => {
        createElement(button.dataset.type);
    });
});

// Create a new element based on type and optional data
function createElement(type, data = {}) {
    const workspace = document.getElementById('workspace');
    const element = document.createElement('div');
    element.className = `element ${type}`;
    element.setAttribute('draggable', true);
    element.style.top = data.position?.top || '0px';
    element.style.left = data.position?.left || '0px';
    element.style.backgroundColor = data.backgroundColor || '';

    // Create and append delete button
    const deleteButton = document.createElement('span');
    deleteButton.className = 'delete';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener('click', () => {
        workspace.removeChild(element);
        saveState();  // Save state after deleting
    });

    // Create and append color picker
    const colorPicker = document.createElement('span');
    colorPicker.className = 'color-picker';
    colorPicker.innerHTML = '<i class="fas fa-palette"></i>';
    colorPicker.addEventListener('click', () => toggleColorPalette(element));

    const colorPalette = createColorPalette();
    colorPalette.classList.add('color-palette', 'hidden');
    colorPicker.appendChild(colorPalette);

    element.appendChild(deleteButton);
    element.appendChild(colorPicker);

    // Create specific content based on type
    switch (type) {
        case 'note':
            const noteTitle = document.createElement('input');
            noteTitle.type = 'text';
            noteTitle.placeholder = 'Title';
            noteTitle.className = 'note-title';
            noteTitle.value = data.content?.title || '';

            const noteTextarea = document.createElement('textarea');
            noteTextarea.placeholder = 'Write your note here...';
            noteTextarea.className = 'note-content';
            noteTextarea.maxLength = '120';
            noteTextarea.value = data.content?.text || '';
            noteTextarea.addEventListener('input', adjustHeight);

            element.appendChild(noteTitle);
            element.appendChild(noteTextarea);

            adjustHeight.call(noteTextarea);
            break;

        case 'todo':
            const todoList = document.createElement('ul');
            const taskInput = document.createElement('input');
            taskInput.type = 'text';
            taskInput.placeholder = 'Add a task...';
            taskInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && this.value.trim()) {
                    if (todoList.querySelectorAll('li').length < 7) {  // Limit to 7 tasks
                        const taskItem = createTaskItem(this.value.trim());
                        todoList.appendChild(taskItem);
                        this.value = '';
                        saveState();  // Save state after adding a task
                    } else {
                        alert('Task limit reached. You can only add up to 7 tasks.');
                    }
                }
            });

            // Load existing tasks if any
            (data.content?.tasks || []).forEach(task => {
                const taskItem = createTaskItem(task.text, task.checked);
                todoList.appendChild(taskItem);
            });

            element.appendChild(taskInput);
            element.appendChild(todoList);

            // Adjust height of to-do list if content is too long
            todoList.addEventListener('input', adjustTodoHeight);
            break;

        case 'label':
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.placeholder = 'Enter Title';
            labelInput.maxLength = '10';
            labelInput.className = 'label-title';
            labelInput.value = data.content?.title || '';
            labelInput.addEventListener('change', () => saveState());  // Save state when label title changes
            element.appendChild(labelInput);
            break;

        case 'timer':
            const timerDisplay = document.createElement('div');
            timerDisplay.textContent = '00:00';
            const timerInput = document.createElement('input');
            timerInput.type = 'number';
            timerInput.placeholder = 'Set timer (minutes)';
            timerInput.value = data.content?.duration || '';
            const startTimerButton = document.createElement('button');
            startTimerButton.innerHTML = '<i class="fas fa-play"></i>';
            startTimerButton.addEventListener('click', () => startTimer(timerDisplay, timerInput.value));
            element.appendChild(timerInput);
            element.appendChild(startTimerButton);
            element.appendChild(timerDisplay);
            break;

        case 'stopwatch':
            const stopwatchDisplay = document.createElement('div');
            stopwatchDisplay.className = 'stopwatch-display';
            stopwatchDisplay.textContent = '00:00:00';
            const startStopwatchButton = document.createElement('button');
            const resetStopwatchButton = document.createElement('button');
            let stopwatchInterval;
            let stopwatchSeconds = data.content?.seconds || 0;

            startStopwatchButton.innerHTML = '<i class="fas fa-play"></i>';
            startStopwatchButton.addEventListener('click', () => {
                if (stopwatchInterval) clearInterval(stopwatchInterval);
                stopwatchInterval = setInterval(() => {
                    stopwatchSeconds++;
                    stopwatchDisplay.textContent = formatStopwatch(stopwatchSeconds);
                }, 1000);
            });

            resetStopwatchButton.innerHTML = '<i class="fas fa-undo"></i>';
            resetStopwatchButton.addEventListener('click', () => {
                clearInterval(stopwatchInterval);
                stopwatchSeconds = 0;
                stopwatchDisplay.textContent = '00:00:00';
            });

            element.appendChild(startStopwatchButton);
            element.appendChild(resetStopwatchButton);
            element.appendChild(stopwatchDisplay);
            break;
    }

    workspace.appendChild(element);
    makeDraggable(element);
    saveState();  // Save state after creating a new element
}

// Create a new task item with a delete button
function createTaskItem(text, checked = false) {
    const taskItem = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;

    const taskText = document.createElement('span');
    taskText.textContent = text;

    // Create and append delete button
    const deleteTaskButton = document.createElement('span');
    deleteTaskButton.className = 'delete-task';
    deleteTaskButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteTaskButton.addEventListener('click', () => {
        taskItem.remove();
        saveState();  // Save state after deleting a task
    });

    checkbox.addEventListener('change', function () {
        taskText.style.textDecoration = this.checked ? 'line-through' : 'none';
        saveState();  // Save state when tasks are checked/unchecked
    });

    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteTaskButton);
    return taskItem;
}

// Adjust height of textarea or note content
function adjustHeight() {
    this.style.height = 'auto';
    this.style.height = `${Math.max(this.scrollHeight, 100)}px`;
}

// Adjust height of to-do list if content is too long
function adjustTodoHeight() {
    const todoList = this.parentElement.querySelector('ul');
    todoList.style.height = 'auto';
    todoList.style.height = `${Math.max(todoList.scrollHeight, 100)}px`;
}

// Create color palette
function createColorPalette() {
    const palette = document.createElement('div');
    palette.className = 'color-palette';
    const colors = ['hotpink', 'lightgreen', 'lightblue', '#FFFF88', '#ce81ff', '#ffc14a'];

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.addEventListener('click', (e) => {
            const element = e.target.closest('.element');
            changeElementColor(element, color);
        });
        palette.appendChild(colorOption);
    });

    return palette;
}

// Toggle color palette visibility
function toggleColorPalette(element) {
    const colorPalette = element.querySelector('.color-palette');
    colorPalette.classList.toggle('hidden');
}

// Change element color
function changeElementColor(element, color) {
    element.style.backgroundColor = color;
    saveState();  // Save state when color changes
}

// Make elements draggable
function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener('dragstart', (e) => {
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    element.addEventListener('dragend', (e) => {
        element.style.left = `${e.clientX - offsetX}px`;
        element.style.top = `${e.clientY - offsetY}px`;
        saveState();  // Save state after moving
    });
}

// Start timer
function startTimer(display, duration) {
    let time = parseInt(duration, 10) * 60;
    const interval = setInterval(() => {
        if (time <= 0) {
            clearInterval(interval);
            display.textContent = '00:00';
            return;
        }
        time--;
        display.textContent = formatTime(time);
    }, 1000);
}

// Format time for timer
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format stopwatch time
function formatStopwatch(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Save the state of all elements to local storage
function saveState() {
    const elements = document.querySelectorAll('.element');
    const state = Array.from(elements).map(element => {
        return {
            type: element.classList[1],
            position: {
                top: element.style.top,
                left: element.style.left,
            },
            backgroundColor: element.style.backgroundColor,
            content: getElementContent(element),
        };
    });
    localStorage.setItem('workspaceState', JSON.stringify(state));
}

// Get content for different element types
function getElementContent(element) {
    const type = element.classList[1];
    switch (type) {
        case 'note':
            return {
                title: element.querySelector('.note-title').value,
                text: element.querySelector('.note-content').value,
            };
        case 'todo':
            return {
                tasks: Array.from(element.querySelectorAll('ul li')).map(taskItem => {
                    return {
                        text: taskItem.querySelector('span').textContent,
                        checked: taskItem.querySelector('input').checked,
                    };
                }),
            };
        case 'label':
            return {
                title: element.querySelector('.label-title').value,
            };
        case 'timer':
            return {
                duration: element.querySelector('input').value,
            };
        case 'stopwatch':
            const stopwatchDisplay = element.querySelector('.stopwatch-display');
            const timeText = stopwatchDisplay.textContent.split(':').map(Number);
            return {
                seconds: (timeText[0] * 3600) + (timeText[1] * 60) + timeText[2],
            };
    }
}

// Load the state of all elements from local storage
function loadState() {
    const state = JSON.parse(localStorage.getItem('workspaceState')) || [];
    state.forEach(data => {
        createElement(data.type, data);
    });
}
