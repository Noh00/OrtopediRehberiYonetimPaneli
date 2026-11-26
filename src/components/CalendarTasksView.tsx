import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Kanban,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  BlogPost,
  TaskPriority,
  TaskStatus,
  TeamTask,
  TeamUser,
} from '../types/admin';
import { SafeImage } from './SafeImage';

interface CalendarTasksViewProps {
  tasks: TeamTask[];
  posts: BlogPost[];
  users: TeamUser[];
  canManage: boolean;
  onAddTask: (task: TeamTask) => void;
  onUpdateTask: (task: TeamTask) => void;
  onDeleteTask: (id: string) => void;
  onEditPost: (post: BlogPost) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'Yapılacaklar' },
  { id: 'in_progress', title: 'Sürüyor / Yazımda' },
  { id: 'review', title: 'Editör İncelemesinde' },
  { id: 'done', title: 'Tamamlandı' },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};

const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const TR_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const CalendarTasksView: React.FC<CalendarTasksViewProps> = ({
  tasks,
  posts,
  users,
  canManage,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onEditPost,
}) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('calendar');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskAssignee, setTaskAssignee] = useState<string>(users[0]?.id ?? '');
  const [taskDue, setTaskDue] = useState(todayStr);
  const [taskPostId, setTaskPostId] = useState<string>('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) =>
      assigneeFilter === 'all' ? true : t.assigneeId === assigneeFilter
    );
  }, [tasks, assigneeFilter]);

  const openCreateModal = (defaultDate = todayStr, defaultStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus(defaultStatus);
    setTaskAssignee(users[0]?.id ?? '');
    setTaskDue(defaultDate);
    setTaskPostId('');
    setModalOpen(true);
  };

  const openEditModal = (t: TeamTask) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDesc(t.description);
    setTaskPriority(t.priority);
    setTaskStatus(t.status);
    setTaskAssignee(t.assigneeId);
    setTaskDue(t.dueDate);
    setTaskPostId(t.linkedPostId ?? '');
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: taskStatus,
        assigneeId: taskAssignee,
        dueDate: taskDue,
        linkedPostId: taskPostId || undefined,
      });
    } else {
      onAddTask({
        id: `tsk-${Date.now()}`,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: taskStatus,
        assigneeId: taskAssignee,
        dueDate: taskDue,
        linkedPostId: taskPostId || undefined,
        tags: ['Ekip'],
        createdAt: todayStr,
      });
    }
    setModalOpen(false);
  };

  const moveStage = (task: TeamTask, direction: -1 | 1) => {
    const idx = COLUMNS.findIndex((c) => c.id === task.status);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= COLUMNS.length) return;
    onUpdateTask({ ...task, status: COLUMNS[nextIdx].id });
  };

  // Calendar Grid calculation (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const jsDay = firstDay.getDay(); // 0=Sun..6=Sat
    const leadingEmpty = jsDay === 0 ? 6 : jsDay - 1;

    const cells: { dateStr: string | null; dayNum: number | null }[] = [];
    for (let i = 0; i < leadingEmpty; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ dateStr: `${currentYear}-${mm}-${dd}`, dayNum: d });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ dateStr: null, dayNum: null });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const changeMonth = (delta: number) => {
    const d = new Date(currentYear, currentMonth + delta, 1);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Yayın Takvimi</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Görev Panosu ({filteredTasks.length})</span>
            </button>
          </div>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Ekip üyesine göre filtrele"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tüm Ekip Üyeleri</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Görev Ekle</span>
          </button>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {TR_MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setCurrentYear(d.getFullYear());
                  setCurrentMonth(d.getMonth());
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Önceki ay"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Sonraki ay"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            {TR_WEEKDAYS.map((wd) => (
              <div key={wd} className="py-2.5">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {calendarDays.map((cell, idx) => {
              if (!cell.dateStr || !cell.dayNum) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[112px] bg-slate-50/40 dark:bg-slate-950/30"
                  />
                );
              }

              const dayPosts = posts.filter(
                (p) => (p.scheduledFor || p.publishedAt) === cell.dateStr
              );
              const dayTasks = filteredTasks.filter((t) => t.dueDate === cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={cell.dateStr}
                  className={`group min-h-[112px] p-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 ${
                    isToday ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isToday
                          ? 'font-bold text-blue-700 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openCreateModal(cell.dateStr!)}
                        title="Bu güne görev ekle"
                        className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayPosts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onEditPost(p)}
                        className="block w-full truncate rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-left text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        Yayın: {p.title}
                      </button>
                    ))}
                    {dayTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openEditModal(t)}
                        className={`block w-full truncate rounded border px-1.5 py-1 text-left text-[11px] font-medium ${
                          t.status === 'done'
                            ? 'border-slate-200 bg-slate-100 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}
                      >
                        Görev: {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col, colIndex) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="font-display text-xs font-semibold text-slate-900 dark:text-white">
                    {col.title}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                      Şu anda Herhangi bir veri bulunamadı
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const assignee = users.find((u) => u.id === task.assigneeId);
                      const linkedPost = posts.find((p) => p.id === task.linkedPostId);
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[11px] font-semibold ${
                                task.priority === 'urgent'
                                  ? 'text-red-600 dark:text-red-400'
                                  : task.priority === 'high'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {PRIORITY_LABELS[task.priority]} Öncelik
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {task.dueDate}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="mt-1.5 block text-left text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                          >
                            {task.title}
                          </button>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {task.description}
                            </p>
                          )}

                          {linkedPost && (
                            <button
                              type="button"
                              onClick={() => onEditPost(linkedPost)}
                              className="mt-2 block w-full truncate rounded bg-slate-50 px-2 py-1 text-left text-[11px] text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                            >
                              Yazı: {linkedPost.title}
                            </button>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <SafeImage
                                src={assignee?.avatarUrl}
                                alt={assignee?.name ?? 'Atanmış kişi'}
                                fallbackLabel={assignee?.name ?? 'EK'}
                                isAvatar
                                className="h-6 w-6 rounded-md object-cover"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {assignee?.name?.split(' ')[0] ?? 'Ekip'}
                              </span>
                            </div>

                            {canManage && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={colIndex === 0}
                                  onClick={() => moveStage(task, -1)}
                                  title="Önceki aşamaya taşı"
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={colIndex === COLUMNS.length - 1}
                                  onClick={() => moveStage(task, 1)}
                                  title="Sonraki aşamaya taşı"
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTask(task.id)}
                                  title="Görevi sil"
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => openCreateModal(todayStr, col.id)}
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Görev Ekle</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {editingTask ? 'Görevi Düzenle' : 'Yeni Ekip Görevi Oluştur'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Görev Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Örn: Haftalık SEO performans özetini hazırla"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Açıklama
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Sorumlu Ekip Üyesi
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Atanmamış</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Son Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Aşama
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Öncelik
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  İlişkili Blog Yazısı (İsteğe bağlı)
                </label>
                <select
                  value={taskPostId}
                  onChange={(e) => setTaskPostId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Bağlı yazı yok</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {editingTask ? 'Güncelle' : 'Görevi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
