# CampusOS — Student Command Center

CampusOS is a responsive, browser-based student productivity dashboard built with **HTML, CSS and vanilla JavaScript**. It brings assignments, attendance, focus sessions and quick notes into one simple workspace.

## Features

- **Overview dashboard:** task counts, completion stats and attendance snapshot.
- **Task manager:** create, complete, filter and delete tasks with subject, due date and priority.
- **Attendance tracker:** track attended/total classes and calculate percentages automatically.
- **Focus room:** Pomodoro timer with 25-minute focus, 5-minute short break and 15-minute long break modes.
- **Quick notes:** create and delete notes.
- **Dark mode:** switch between light and dark appearance.
- **Local persistence:** tasks, subjects, notes, theme and focus statistics are saved in browser `localStorage`.
- **Responsive layout:** designed for desktop, tablet and mobile screens.

## Run locally

No installation, package manager or server is required.

1. Download or clone this repository.
2. Open the `CampusOS` folder.
3. Double-click `index.html` to open it in a modern browser.

For a local development server, you can also use the Live Server extension in Visual Studio Code.

## Project structure

```text
CampusOS/
├── index.html
├── style.css
├── script.js
├── assets/
│   └── logo.svg
├── README.md
└── .gitignore
```

## Git workflow suggestion

Use GitHub Desktop to practise a real feature-based workflow:

1. Create the repository with the initial project files.
2. Commit the starter dashboard on `main`.
3. Create `feature/task-manager`; implement or refine task management; commit and merge it.
4. Create `feature/attendance`; implement or refine attendance tracking; commit and merge it.
5. Create `feature/focus-room`; implement or refine the timer; commit and merge it.
6. Create `feature/notes-and-theme`; commit and merge it.
7. Create a `fix/validation` branch, test invalid attendance values and empty form submissions, and commit any fixes.
8. Add a GitHub release/tag named `v1.0`.

Keep each commit focused and use clear messages, such as `Add attendance tracker` or `Fix attendance validation`.

## Data and privacy

CampusOS stores data in the browser's local storage on the device where it is used. It does not send your tasks, notes or attendance to a server. Clearing browser site data can erase this information, so export or back up anything important separately.

## Technologies

- HTML5
- CSS3 (responsive layout, CSS variables)
- JavaScript (DOM, events, timers and localStorage)
- Google Fonts (DM Sans and Manrope; falls back to system fonts if unavailable)

## License

This project is provided for educational and personal use.
