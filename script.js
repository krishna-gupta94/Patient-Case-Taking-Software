// NIVARA - Common JavaScript

function go(page) {
    window.location.href = page;
}

// Logout
function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
        localStorage.removeItem('ayush_token');
        localStorage.removeItem('ayush_user');
        window.location.href = "index.html";
    }
}

// Success message
function showMessage(message) {
    alert("✅ " + message);
}

// Error message
function showError(message) {
    alert("❌ " + message);
}

function applyDarkMode(enabled) {
    document.documentElement.classList.toggle("dark-mode", enabled);
    if (document.body) {
        document.body.classList.toggle("dark-mode", enabled);
    }
}

// Dark mode
function toggleDarkMode() {
    const enabled = !document.documentElement.classList.contains("dark-mode");
    localStorage.setItem("ayushDarkMode", String(enabled));
    applyDarkMode(enabled);
}

// Load dark mode
window.addEventListener("DOMContentLoaded", function () {
    const enabled = localStorage.getItem("ayushDarkMode") === "true";
    applyDarkMode(enabled);

    const darkModeToggle = document.getElementById("darkMode");
    if (darkModeToggle) {
        darkModeToggle.checked = enabled;
        darkModeToggle.addEventListener("change", toggleDarkMode);
    }
});

// Today's date
function getTodayDate() {
    const today = new Date();

    return today.toISOString().split("T")[0];
}

// Search table
function searchTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);

    if (!input || !table) return;

    input.addEventListener("keyup", function () {
        const value = this.value.toLowerCase();
        const rows = table.getElementsByTagName("tr");

        for (let i = 1; i < rows.length; i++) {
            const text = rows[i].innerText.toLowerCase();

            rows[i].style.display =
                text.includes(value) ? "" : "none";
        }
    });
}
applyDarkMode(localStorage.getItem("ayushDarkMode") === "true");
