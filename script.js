/* CampusOS — client-side student productivity dashboard */
const STORAGE_KEY = "campusos-data-v1";
const defaults = { tasks: [], subjects: [], notes: [], sessions: 0, focusedMinutes: 0, theme: "light" };
let state = loadState();
let activeFilter = "all";
let timer = { duration: 25 * 60, remaining: 25 * 60, interval: null, running: false, mode: 25 };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timeout); showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2300);
}
function dateLabel(date) {
  if (!date) return "No due date";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "No due date" : d.toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
}
function getAttendance() {
  if (!state.subjects.length) return null;
  const total = state.subjects.reduce((sum, subject) => sum + subject.total, 0);
  const attended = state.subjects.reduce((sum, subject) => sum + subject.attended, 0);
  return total ? Math.round(attended / total * 100) : 0;
}
function renderStats() {
  const open = state.tasks.filter(t => !t.done).length;
  $("#statOpen").textContent = open; $("#statDone").textContent = state.tasks.filter(t => t.done).length;
  $("#statAttendance").textContent = getAttendance() === null ? "—" : `${getAttendance()}%`;
  $("#statSessions").textContent = state.sessions;
  $("#navTaskCount").textContent = open;
  $("#focusSessions").textContent = state.sessions; $("#focusMinutes").textContent = state.focusedMinutes;
  const avg = getAttendance();
  $("#ringValue").textContent = avg === null ? "—" : `${avg}%`;
  $("#attendanceRing").style.background = `conic-gradient(var(--accent) ${avg === null ? 0 : avg * 3.6}deg, var(--line) 0deg)`;
  $("#attendanceMessage").textContent = avg === null ? "Add your subjects" : avg >= 75 ? "You're building consistency" : "There's room to improve";
  $("#attendanceSubtext").textContent = avg === null ? "Track classes attended to see your progress here." : `${state.subjects.length} subject${state.subjects.length === 1 ? "" : "s"} tracked so far.`;
  $("#todayLabel").textContent = new Date().toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" }).toUpperCase();
}
function taskMarkup(task) {
  return `<div class="task-row ${task.done ? "done" : ""}">
    <input class="task-check" type="checkbox" data-task-check="${task.id}" ${task.done ? "checked" : ""} aria-label="Complete ${escapeHTML(task.title)}">
    <div class="task-main"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject || "Personal")} · ${escapeHTML(dateLabel(task.date))}</small></div>
    <span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span>
    <button class="edit-btn" data-task-edit="${task.id}" aria-label="Edit task">Edit</button><button class="delete-btn" data-task-delete="${task.id}" aria-label="Delete task">×</button></div>`;
}
function renderTasks() {
  const pending = state.tasks.filter(t => !t.done).sort((a,b) => (a.date || "9999").localeCompare(b.date || "9999"));
  $("#overviewTasks").innerHTML = pending.slice(0, 4).map(taskMarkup).join("");
  $("#overviewEmpty").hidden = pending.length > 0;
  const query = ($("#taskSearch")?.value || $("#globalSearch")?.value || "").trim().toLowerCase();
  const filtered = state.tasks.filter(t => (activeFilter === "all" || (activeFilter === "open" ? !t.done : t.done)) && (!query || `${t.title} ${t.subject}`.toLowerCase().includes(query)))
    .sort((a,b) => Number(a.done) - Number(b.done) || (a.date || "9999").localeCompare(b.date || "9999"));
  $("#allTasks").innerHTML = filtered.map(taskMarkup).join("");
  $("#tasksEmpty").hidden = filtered.length > 0;
  $("#taskCountLabel").textContent = `${filtered.length} task${filtered.length === 1 ? "" : "s"}`;
  $$(".filter-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === activeFilter));
}
function renderAttendance() {
  const avg = getAttendance();
  $("#overviewSubjects").innerHTML = state.subjects.slice(0,3).map(s => {
    const pct = s.total ? Math.round(s.attended / s.total * 100) : 0;
    return `<div class="mini-subject"><span>${escapeHTML(s.name)}</span><div class="mini-track"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
  }).join("");
  $("#subjectGrid").innerHTML = state.subjects.map(s => {
    const pct = s.total ? Math.round(s.attended / s.total * 100) : 0;
    return `<article class="subject-card"><div class="subject-card-head"><h3>${escapeHTML(s.name)}</h3><span class="subject-percent">${pct}%</span></div><div class="subject-meta"><span>${s.attended} attended</span><span>${s.total} total classes</span></div><div class="attendance-actions"><button class="tiny-action" data-attendance-change="${s.id}" data-change="-1" ${s.attended===0?"disabled":""}>− Attended</button><button class="tiny-action" data-attendance-change="${s.id}" data-change="1">＋ Attended</button></div><div class="progress-track"><i style="width:${pct}%"></i></div><button class="delete-btn" data-subject-delete="${s.id}">Remove subject ×</button></article>`;
  }).join("");
  $("#subjectCount").textContent = `${state.subjects.length} subject${state.subjects.length === 1 ? "" : "s"}`;
  $("#attendanceEmpty").hidden = state.subjects.length > 0;
}
function renderNotes() {
  $("#notesGrid").innerHTML = state.notes.map(note => `<article class="note-card"><p>${escapeHTML(note.text)}</p><div class="note-card-bottom"><span>${escapeHTML(note.date)}</span><button class="delete-btn" data-note-delete="${note.id}" aria-label="Delete note">×</button></div></article>`).join("");
  $("#notesEmpty").hidden = state.notes.length > 0;
  $("#noteCount").textContent = `${state.notes.length} note${state.notes.length === 1 ? "" : "s"}`;
}
function renderWeek() {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0,10);
    const count = state.tasks.filter(t => t.done && t.completedAt && t.completedAt.slice(0,10) === key).length;
    return { label: d.toLocaleDateString(undefined,{weekday:"short"}), count };
  });
  const max = Math.max(1, ...days.map(d => d.count));
  $("#weekChart").innerHTML = days.map(d => `<div class="week-day"><div class="bar-wrap"><i style="height:${Math.max(5,d.count/max*100)}%"></i></div><strong>${d.count}</strong><small>${d.label}</small></div>`).join("");
  $("#weekTotal").textContent = `${days.reduce((sum,d)=>sum+d.count,0)} completed`;
}
function renderAll() { renderStats(); renderTasks(); renderAttendance(); renderNotes(); renderWeek(); }
function navigate(view) {
  $$(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
  $$(".nav-link[data-view]").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  $("#breadcrumbTitle").textContent = ({overview:"Overview",tasks:"My tasks",attendance:"Attendance",focus:"Focus room",notes:"Quick notes"})[view] || "Overview";
  $("#sidebar").classList.remove("open"); window.scrollTo({top:0, behavior:"smooth"});
}
$$("[data-view]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.view)));
$$("[data-go]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.go)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.body.classList.toggle("dark", state.theme === "dark"); saveState();
  $("#themeIcon").textContent = state.theme === "dark" ? "☾" : "☼";
});

$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#taskTitle").value.trim();
  if (!title) return showToast("Please enter a task title.");
  state.tasks.push({ id: crypto.randomUUID(), title, subject: $("#taskSubject").value.trim(), date: $("#taskDate").value, priority: $("#taskPriority").value, done:false, createdAt:new Date().toISOString(), completedAt:null });
  saveState(); renderAll(); event.target.reset(); $("#taskTitle").focus(); showToast("Task added to your list.");
});
$$(".filter-btn").forEach(btn => btn.addEventListener("click", () => { activeFilter = btn.dataset.filter; renderTasks(); }));
document.addEventListener("change", event => {
  const check = event.target.closest("[data-task-check]");
  if (check) {
    const task = state.tasks.find(t => t.id === check.dataset.taskCheck);
    if (task) { task.done = check.checked; task.completedAt = task.done ? new Date().toISOString() : null; saveState(); renderAll(); showToast(task.done ? "Nice work — task completed!" : "Task moved back to to-do."); }
  }
});
document.addEventListener("click", event => {
  const taskDelete = event.target.closest("[data-task-delete]");
  const subjectDelete = event.target.closest("[data-subject-delete]");
  const noteDelete = event.target.closest("[data-note-delete]");
  const taskEdit = event.target.closest("[data-task-edit]");
  if (taskEdit) {
    const task = state.tasks.find(t => t.id === taskEdit.dataset.taskEdit);
    if (task) {
      const title = prompt("Edit task title:", task.title);
      if (title !== null && title.trim()) { task.title = title.trim().slice(0,90); saveState(); renderAll(); showToast("Task updated."); }
    }
  }
  if (taskDelete && confirm("Delete this task?")) { state.tasks = state.tasks.filter(t => t.id !== taskDelete.dataset.taskDelete); saveState(); renderAll(); showToast("Task deleted."); }
  if (subjectDelete && confirm("Remove this subject and its attendance data?")) { state.subjects = state.subjects.filter(s => s.id !== subjectDelete.dataset.subjectDelete); saveState(); renderAll(); showToast("Subject removed."); }
  if (noteDelete && confirm("Delete this note?")) { state.notes = state.notes.filter(n => n.id !== noteDelete.dataset.noteDelete); saveState(); renderAll(); showToast("Note deleted."); }
  const attendanceChange = event.target.closest("[data-attendance-change]");
  if (attendanceChange) {
    const subject = state.subjects.find(s => s.id === attendanceChange.dataset.attendanceChange);
    const delta = Number(attendanceChange.dataset.change);
    if (subject && (delta < 0 ? subject.attended > 0 : subject.attended < subject.total)) {
      subject.attended += delta; saveState(); renderAll(); showToast("Attendance updated.");
    } else if (subject && delta > 0) showToast("Attended classes cannot exceed total classes. Add a total class first.");
  }
});

$("#attendanceForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("#subjectName").value.trim(), attended = Number($("#classesAttended").value), total = Number($("#classesTotal").value);
  if (!name) return showToast("Enter a subject name.");
  if (!Number.isInteger(attended) || !Number.isInteger(total) || total < 1 || attended < 0 || attended > total) return showToast("Check the class counts. Attended cannot exceed total.");
  if (state.subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return showToast("That subject is already on your list.");
  state.subjects.push({id:crypto.randomUUID(), name, attended, total}); saveState(); renderAll(); event.target.reset(); $("#classesAttended").value = 0; $("#classesTotal").value = 1; showToast("Subject added.");
});

function updateTimerDisplay() {
  const mins = Math.floor(timer.remaining / 60), secs = timer.remaining % 60;
  $("#timerDisplay").textContent = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  $("#timerProgress").style.strokeDashoffset = 729 * (1 - timer.remaining / timer.duration);
}
function stopTimer() { clearInterval(timer.interval); timer.interval = null; timer.running = false; $("#timerStart").textContent = "Resume"; }
function setTimer(minutes) {
  stopTimer(); timer.mode = minutes; timer.duration = minutes * 60; timer.remaining = timer.duration;
  $$(".mode-btn").forEach(btn => btn.classList.toggle("active", Number(btn.dataset.minutes) === minutes));
  $("#timerStart").textContent = "Start focus"; $("#timerStatus").textContent = minutes === 25 ? "READY TO FOCUS" : "READY FOR A BREAK";
  updateTimerDisplay();
}
$$(".mode-btn").forEach(btn => btn.addEventListener("click", () => setTimer(Number(btn.dataset.minutes))));
$("#timerStart").addEventListener("click", () => {
  if (timer.running) { stopTimer(); $("#timerStatus").textContent = "PAUSED"; return; }
  timer.running = true; $("#timerStart").textContent = "Pause"; $("#timerStatus").textContent = "YOU'RE IN THE ZONE";
  timer.interval = setInterval(() => {
    timer.remaining--; updateTimerDisplay();
    if (timer.remaining <= 0) {
      stopTimer();
      if (timer.mode === 25) { state.sessions++; state.focusedMinutes += 25; saveState(); renderStats(); $("#timerStatus").textContent = "SESSION COMPLETE"; showToast("Focus session complete. Great work!"); }
      else { $("#timerStatus").textContent = "BREAK COMPLETE"; showToast("Break finished. Ready when you are."); }
      $("#timerStart").textContent = "Start again";
    }
  }, 1000);
});
$("#timerReset").addEventListener("click", () => { setTimer(timer.mode); $("#timerStatus").textContent = "TIMER RESET"; });

$("#saveNote").addEventListener("click", () => {
  const text = $("#noteInput").value.trim();
  if (!text) return showToast("Write something before saving.");
  state.notes.unshift({id:crypto.randomUUID(), text, date:new Date().toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})});
  saveState(); renderNotes(); $("#noteInput").value = ""; showToast("Note saved.");
});

document.body.classList.toggle("dark", state.theme === "dark");
$("#themeIcon").textContent = state.theme === "dark" ? "☾" : "☼";
renderAll();

// Search across the workspace and filter task results as the user types.
$("#taskSearch")?.addEventListener("input", () => renderTasks());
$("#globalSearch")?.addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  if (!query) { renderTasks(); return; }
  const matches = state.tasks.some(t => `${t.title} ${t.subject}`.toLowerCase().includes(query));
  const noteMatches = state.notes.some(n => n.text.toLowerCase().includes(query));
  const subjectMatches = state.subjects.some(s => s.name.toLowerCase().includes(query));
  if (matches) { navigate("tasks"); $("#taskSearch").value = event.target.value; renderTasks(); }
  else if (subjectMatches) { navigate("attendance"); showToast("Matching subject found in attendance."); }
  else if (noteMatches) { navigate("notes"); showToast("Matching note found in your notebook."); }
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault(); $("#globalSearch").focus();
  }
});
$("#exportData")?.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({app:"CampusOS",version:2,exportedAt:new Date().toISOString(),data:state},null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `campusos-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url); showToast("Backup downloaded.");
});
$("#importData")?.addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const incoming = parsed.data || parsed;
    if (!incoming || !Array.isArray(incoming.tasks) || !Array.isArray(incoming.subjects) || !Array.isArray(incoming.notes)) throw new Error("Invalid backup");
    if (!confirm("Restore this backup? It will replace the data currently saved in this browser.")) return;
    state = {...defaults,...incoming}; saveState(); renderAll(); showToast("Backup restored successfully.");
  } catch { showToast("That backup file is not valid CampusOS data."); }
  finally { event.target.value = ""; }
});
