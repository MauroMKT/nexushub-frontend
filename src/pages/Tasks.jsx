import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

export default function Tasks() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  function refresh() {
    api.listTasks().then(setTasks).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.createTask({ title, due_date: dueDate ? new Date(dueDate).toISOString() : null });
    setTitle("");
    setDueDate("");
    refresh();
  }

  async function toggleDone(task) {
    await api.updateTask(task.id, { done: !task.done });
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("tasks.title")}</h1>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder={t("tasks.new_task")} value={title} onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl2 px-3 py-2"
          />
          <input
            type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="border border-slate-200 rounded-xl2 px-3 py-2"
          />
          <button type="submit" className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
            + {t("tasks.new_task")}
          </button>
        </form>
      </Card>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="flex items-center gap-3">
            <input type="checkbox" checked={task.done} onChange={() => toggleDone(task)} className="w-5 h-5" />
            <div className="flex-1">
              <div className={`font-medium ${task.done ? "line-through text-ink/40" : ""}`}>{task.title}</div>
              {task.due_date && (
                <div className="text-xs text-ink/50">{new Date(task.due_date).toLocaleString()}</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
