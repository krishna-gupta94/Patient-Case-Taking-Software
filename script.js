```javascript
// AYUSH Care - Common JavaScript

function go(page) {
    window.location.href = page;
}

// Logout
function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
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

// Dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("ayushDarkMode", "true");
    } else {
        localStorage.setItem("ayushDarkMode", "false");
    }
}

// Load dark mode
window.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("ayushDarkMode") === "true") {
        document.body.classList.add("dark-mode");
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
```
