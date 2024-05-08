document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('save-btn');
    const logoutButton = document.getElementById('logout-btn');
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    document.getElementById('userDetails').innerText = `username : ${sessionStorage.getItem('username')} | email: ${sessionStorage.getItem('userEmail')}`;

    todoForm.addEventListener('submit', handleAddTodo);

    const todosList = document.getElementById('todo-list');


    loadTodos();

    //  Event listener for the logout button
    logoutButton.addEventListener('click', function () {
        fetch('/logout', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/login';
                }
            })
            .catch(error => {
                console.error('Error logging out:', error);
            });
    });

    // Function to add a todo
    function addTodo(text) {
        fetch('/addTodo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add todo');
                }
                return response.json();
            })
            .then(data => {
                loadTodos();
            })
            .catch(error => console.error('Error adding todo:', error));
    }


    // Function to handle adding a todo
    function handleAddTodo(event) {
        event.preventDefault();
        const todoText = todoInput.value.trim();
        if (todoText) {
            addTodo(todoText);
            todoInput.value = '';
        }
    }

    // Function to load todos
    function loadTodos() {
        fetch('/api/todos')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load todos');
                }
                return response.json();
            })
            .then(todos => {
                todosList.innerHTML = '';
                todos.forEach((todo, index) => {
                    const row = document.createElement('tr');

                    const numberCell = document.createElement('th');
                    numberCell.scope = 'row';
                    numberCell.textContent = index + 1;
                    row.appendChild(numberCell);

                    const textCell = document.createElement('td');
                    textCell.textContent = todo.text;
                    row.appendChild(textCell);

                    const statusCell = document.createElement('td');
                    statusCell.textContent = todo.completed ? 'Completed' : 'In progress';
                    row.appendChild(statusCell);

                    const actionsCell = document.createElement('td');

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('btn', 'btn-outline-dark');
                    deleteButton.dataset.id = todo._id;
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', () => deleteTodo(todo._id));
                    actionsCell.appendChild(deleteButton);

                    const editButton = document.createElement('button');
                    editButton.classList.add('btn', 'btn-outline-dark', 'ms-1');
                    editButton.dataset.id = todo._id;
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', () => editTodo(todo._id));
                    actionsCell.appendChild(editButton);

                    row.appendChild(actionsCell);
                    todosList.appendChild(row);

                });
            })
            .catch(error => {
                console.error('Error loading todos:', error);
            });
    }

    // Function to edit a todo
    function editTodo(id) {
        const todo = document.querySelector(`button[data-id="${id}"]`).closest('tr');
        const textCell = todo.querySelector('td:nth-child(2)');
        const statusCell = todo.querySelector('td:nth-child(3)');
        const actionsCell = todo.querySelector('td:nth-child(4)');

        let textInput = textCell.querySelector('input');
        let completedCheckbox = statusCell.querySelector('input');
        let saveButton = actionsCell.querySelector('button.save-button');

        if (!textInput) {
            textInput = document.createElement('input');
            textInput.value = textCell.textContent;
            textInput.id = 'todo-text-input';
            textCell.textContent = '';
            textCell.appendChild(textInput);
        }

        if (!completedCheckbox) {
            completedCheckbox = document.createElement('input');
            completedCheckbox.type = 'checkbox';
            completedCheckbox.id = 'todo-completed-checkbox';
            completedCheckbox.checked = statusCell.textContent.trim() === 'Completed';
            statusCell.textContent = '';
            statusCell.appendChild(completedCheckbox);
        }

        if (!saveButton) {
            saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.classList.add('btn', 'btn-outline-dark', 'ms-1', 'save-button');
            actionsCell.appendChild(saveButton);

            saveButton.addEventListener('click', () => {
                const newText = textInput.value.trim();
                const newCompleted = completedCheckbox.checked;
                const token = sessionStorage.getItem('token');

                fetch('/editTodo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ id, text: newText, completed: newCompleted })
                })
                    .then(response => response.json())
                    .then(data => {
                        // Update the row with the new todo text and completion status
                        textCell.textContent = newText;
                        statusCell.textContent = newCompleted ? 'Completed' : 'In progress';

                        // Remove input fields, checkbox, and "Save" button
                        if (textInput.parentNode) textCell.removeChild(textInput);
                        if (completedCheckbox.parentNode) statusCell.removeChild(completedCheckbox);
                        if (saveButton.parentNode) actionsCell.removeChild(saveButton);
                        loadTodos();
                    })
                    .catch(error => console.error('Error editing todo:', error));
            });
        }
    }


    function deleteTodo(id) {
        const token = sessionStorage.getItem('token');
        fetch('/deleteTodo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ todoId: id })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete todo');
                }
                return response.json();
            })
            .then(data => {
                loadTodos();
            })
            .catch(error => console.error('Error deleting todo:', error));
    }
});