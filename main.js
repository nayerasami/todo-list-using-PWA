let taskTitle = document.getElementById("tasktxt");
let taskHours = document.getElementById("hoursNum");
let taskMins = document.getElementById("minNum");
let taskDate = document.getElementById("taskDate");
let addButton = document.getElementById("addBtn");

let tasks = [];
addButton.addEventListener("click", () => {
    addTask();
});

let addTask = function () {
    let task = {
        title: taskTitle.value,
        time: `${taskHours.value}h ${taskMins.value}m`,
        date: taskDate.value,
        notified: false
    };
    console.log(task);
    tasks.push(task);
    saveTaskToIndexedDB(task);
    displayTask();
    scheduleNotification(task);
    document.querySelector(".tasksForm").reset();
};

let displayTask = function () {
    let tasksContainer = document.querySelector(".sticky-note");
    tasksContainer.innerHTML = '';
    tasks.forEach((task, i) => {
        let taskItem = document.createElement("div");
        taskItem.className = `row my-3 justify-content-between mx-2 align-items-center taskEl ${task.notified ? 'finished' : ''}`;

        taskItem.innerHTML = `
            <div class="col-md-6">
                <p class="taskTxt">${task.title} <br> <span>${task.time}</span> <span>${task.date}</span></p>
            </div>
            <div class="col-md-6">
                <button class="btn finishBtn" onclick="finishTask(${i})">Finish</button>
                <button class="btn btn-outline-light delete-btn my-1" onclick="deleteTask(${i})">Delete</button>
            </div>`;
        tasksContainer.appendChild(taskItem);
    });
};

let saveTaskToIndexedDB = function (task) {
    const request = indexedDB.open("TaskDB", 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("title", "title", { unique: false });
        objectStore.createIndex("time", "time", { unique: false });
        objectStore.createIndex("date", "date", { unique: false });
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction("tasks", "readwrite");
        const objectStore = transaction.objectStore("tasks");

        objectStore.add(task);
    };

    request.onerror = function (event) {
        console.error("Error opening database:", event.target.errorCode);
    };
};

function deleteTask(index) {
    console.log(index);

    const request = indexedDB.open("TaskDB", 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction("tasks", "readwrite");
        const objectStore = transaction.objectStore("tasks");

        const getRequest = objectStore.getAll();

        getRequest.onsuccess = function () {
            const tasksFromDB = getRequest.result;
            const taskIdToDelete = tasksFromDB[index].id;

            const deleteRequest = objectStore.delete(taskIdToDelete);

            deleteRequest.onsuccess = function () {
                console.log("Task deleted successfully");
                tasks.splice(index, 1);
                displayTask();
            };

            deleteRequest.onerror = function () {
                console.error("Error deleting task:", deleteRequest.error);
            };
        };
    };
}

let finishTask = function (index) {
    let taskItems = document.querySelectorAll(".taskEl");

    if (index >= 0 && index < taskItems.length) {
        let finishedTask = taskItems[index];
        finishedTask.classList.add('finished');
        tasks[index].notified = true;
    }
};

let notifyButton = document.querySelector(".notifyBtn");

notifyButton.addEventListener("click", () => {
    requestNotificationPermission();
});
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                console.log("Notification permission granted!");
            } else {
                console.warn("Notification permission denied.");
            }
        });
    }
}

function scheduleNotification(task) {
    const taskDateTime = new Date(`${task.date}T${taskHours.value}:${taskMins.value}:00`);
    const now = new Date();

    if (taskDateTime > now) {
        const timeDifference = taskDateTime - now;
        setTimeout(() => {
            if (!task.notified) {
                notifyUser(task);
            }
        }, timeDifference);
    }
}

function notifyUser(task) {
    if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                const notification = new Notification(`Task Reminder: ${task.title}`, {
                    body: `Time to complete the task: ${task.time} on ${task.date}`
                });

                notification.onclick = function () {
                    finishTask(tasks.indexOf(task));
                    this.close();
                };
            }
        });
    }
}
