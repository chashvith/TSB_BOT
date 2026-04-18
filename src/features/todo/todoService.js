const { randomUUID } = require("crypto");

class TodoService {
  constructor({ storage, logger }) {
    this.storage = storage;
    this.logger = logger;
    this.selectedTasks = new Map();
  }

  ensureUser(data, userId) {
    const id = String(userId);

    if (!data.users[id]) {
      data.users[id] = {
        tasksCompleted: 0,
        studyTime: 0,
        totalXp: 0,
      };
    }

    return data.users[id];
  }

  addTask(userId, text) {
    const normalizedUserId = String(userId);
    const normalizedText = String(text || "").trim();
    const comparableText = normalizedText.toLowerCase();

    const data = this.storage.loadData(this.logger);
    this.ensureUser(data, normalizedUserId);

    const duplicate = data.tasks.find(
      (task) =>
        String(task.userId) === normalizedUserId &&
        !task.completed &&
        String(task.text || "")
          .trim()
          .toLowerCase() === comparableText,
    );

    if (duplicate) {
      return {
        ok: false,
        code: "DUPLICATE_TASK",
        task: duplicate,
      };
    }

    const task = {
      id: randomUUID(),
      userId: normalizedUserId,
      text: normalizedText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    data.tasks.push(task);
    this.storage.saveData(data, this.logger);

    return { ok: true, task };
  }

  setSelectedTask(userId, taskId) {
    this.selectedTasks.set(String(userId), String(taskId));
  }

  getSelectedTask(userId) {
    return this.selectedTasks.get(String(userId)) || null;
  }

  clearSelectedTask(userId) {
    this.selectedTasks.delete(String(userId));
  }

  getTaskByUserAndId(userId, taskId) {
    const normalizedUserId = String(userId);
    const normalizedTaskId = String(taskId || "").trim();
    const data = this.storage.loadData(this.logger);

    return data.tasks.find(
      (task) =>
        String(task.id) === normalizedTaskId &&
        String(task.userId) === normalizedUserId,
    );
  }

  getTasksByUser(userId) {
    const normalizedUserId = String(userId);
    const data = this.storage.loadData(this.logger);

    return data.tasks
      .filter((task) => String(task.userId) === normalizedUserId)
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
  }

  removeTask(userId, taskId) {
    const normalizedUserId = String(userId);
    const normalizedTaskId = String(taskId || "").trim();
    const data = this.storage.loadData(this.logger);

    const task = data.tasks.find((item) => item.id === normalizedTaskId);
    if (!task) {
      return { ok: false, code: "TASK_NOT_FOUND" };
    }

    if (String(task.userId) !== normalizedUserId) {
      return { ok: false, code: "FORBIDDEN" };
    }

    data.tasks = data.tasks.filter((item) => item.id !== normalizedTaskId);
    this.storage.saveData(data, this.logger);

    return { ok: true, task };
  }

  completeTask(userId, taskId) {
    const normalizedUserId = String(userId);
    const normalizedTaskId = String(taskId || "").trim();
    const data = this.storage.loadData(this.logger);

    const task = data.tasks.find((item) => item.id === normalizedTaskId);
    if (!task) {
      return { ok: false, code: "TASK_NOT_FOUND" };
    }

    if (String(task.userId) !== normalizedUserId) {
      return { ok: false, code: "FORBIDDEN" };
    }

    if (task.completed) {
      return { ok: false, code: "TASK_ALREADY_COMPLETED", task };
    }

    task.completed = true;
    const userStats = this.ensureUser(data, normalizedUserId);
    userStats.tasksCompleted += 1;

    this.storage.saveData(data, this.logger);
    return { ok: true, task, userStats };
  }
}

module.exports = {
  TodoService,
};
