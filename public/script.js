"use strict";

/*
============================================================
 ARZOO RESTAURANT - FRONTEND APPLICATION
============================================================
*/

// --- CONFIGURATION CHECK ---
if (typeof CONFIG === "undefined") {
    throw new Error("config.js was not loaded.");
}

// --- APPLICATION STATE ---
const state = {
    currentPage: "dashboard",
    currentPeriod: "month",
    authenticated: false,
    loading: false
};

// --- DOM HELPERS ---
const $ = (id) => document.getElementById(id);
const all = (selector) => document.querySelectorAll(selector);

// --- CONFIG APPLICATION ---
function applyConfig() {
    const restaurantName = CONFIG.restaurantName || "Arzoo Restaurant";
    const currency = CONFIG.currency || "PKR";

    ["loginRestaurantName", "brandName", "headerRestaurantName", "settingsRestaurantName"].forEach(id => {
        if ($(id)) $(id).textContent = restaurantName;
    });

    if ($("settingsCurrency")) {
        $("settingsCurrency").textContent = currency;
    }

    // Apply Dynamic Theme
    if (CONFIG.theme) {
        const root = document.documentElement;
        const themeMap = {
            primary: "--primary",
            primaryDark: "--primary-dark",
            background: "--background",
            card: "--card",
            text: "--text",
            muted: "--muted",
            danger: "--danger",
            success: "--success"
        };

        Object.entries(themeMap).forEach(([key, variable]) => {
            if (CONFIG.theme[key]) {
                root.style.setProperty(variable, CONFIG.theme[key]);
            }
        });
    }

    // Apply Icons
    const icons = CONFIG.emojis || {};
    const iconMappings = {
        loginLogo: icons.restaurant,
        brandLogo: icons.restaurant,
        navDashboardIcon: icons.dashboard,
        navSalesIcon: icons.sales,
        navExpenseIcon: icons.expense,
        navNotesIcon: icons.notes,
        navStatisticsIcon: icons.statistics,
        navSettingsIcon: icons.settings,
        menuNotesIcon: icons.notes,
        menuStatisticsIcon: icons.statistics,
        menuSettingsIcon: icons.settings,
        statSalesIcon: icons.sales,
        statExpenseIcon: icons.expense,
        statProfitIcon: icons.profit,
        statTransactionIcon: icons.transactions,
        quickSalesIcon: icons.sales,
        quickExpenseIcon: icons.expense,
        quickNotesIcon: icons.notes,
        statisticsSalesIcon: icons.sales,
        statisticsExpenseIcon: icons.expense,
        statisticsProfitIcon: icons.profit,
        statisticsTransactionIcon: icons.transactions
    };

    Object.entries(iconMappings).forEach(([id, src]) => setImage(id, src));
}

function setImage(id, source) {
    const element = $(id);
    if (!element) return;

    if (typeof source === "string" && source.trim()) {
        element.src = source.trim();
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

// --- API REQUEST HELPER ---
async function api(url, options = {}) {
    const defaultHeaders = { "Accept": "application/json" };

    if (options.body && !(options.body instanceof FormData)) {
        defaultHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) },
        credentials: "same-origin"
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        state.authenticated = false;
        lockApplication(false);
        throw new Error("Your session has expired.");
    }

    if (!response.ok) {
        throw new Error(data?.error || "Something went wrong.");
    }

    return data;
}

// --- FORMATTERS ---
function formatMoney(value) {
    const amount = Number(value) || 0;
    const currency = CONFIG.currency || "PKR";
    return `${currency} ${amount.toLocaleString("en-PK", {
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function formatShortDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short"
    });
}

// --- HTML ESCAPING ---
function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// --- TOAST NOTIFICATIONS ---
let toastTimer;
function showToast(message, type = "success") {
    const container = $("toastContainer");
    if (!container) return;

    clearTimeout(toastTimer);

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.innerHTML = "";
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

// --- AUTHENTICATION ---
async function checkAuthentication() {
    try {
        const result = await api("/api/auth/status");
        if (result.authenticated) {
            state.authenticated = true;
            showApplication();
            await loadApplication();
        } else {
            showLogin();
        }
    } catch {
        showLogin();
    }
}

function showLogin() {
    $("loginScreen")?.classList.remove("hidden");
    $("app")?.classList.add("hidden");
    setTimeout(() => $("passwordInput")?.focus(), 100);
}

function showApplication() {
    $("loginScreen")?.classList.add("hidden");
    $("app")?.classList.remove("hidden");
}

async function handleLogin(event) {
    event.preventDefault();
    const password = $("passwordInput").value;
    const error = $("loginError");
    const button = $("loginButton");

    error.textContent = "";

    if (!password) {
        error.textContent = "Please enter your password.";
        return;
    }

    button.disabled = true;
    button.classList.add("loading");

    try {
        const result = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ password })
        });

        if (result.success) {
            state.authenticated = true;
            $("passwordInput").value = "";
            showApplication();
            await loadApplication();
            showToast("Dashboard unlocked.", "success");
        }
    } catch (err) {
        error.textContent = err instanceof Error ? err.message : "Login failed.";
    } finally {
        button.disabled = false;
        button.classList.remove("loading");
    }
}

async function lockDashboard() {
    try {
        await api("/api/auth/logout", { method: "POST" });
    } catch {
        // Session already terminated
    }
    lockApplication(true);
}

function lockApplication(showMessage = true) {
    state.authenticated = false;
    $("app")?.classList.add("hidden");
    $("loginScreen")?.classList.remove("hidden");
    if ($("passwordInput")) $("passwordInput").value = "";

    if (showMessage && $("loginError")) {
        $("loginError").textContent = "Dashboard locked.";
    }

    setTimeout(() => $("passwordInput")?.focus(), 100);
}

// --- LOAD DATA ---
async function loadApplication() {
    updateCurrentDate();

    await Promise.allSettled([
        loadDashboard(),
        loadSales(),
        loadExpenses(),
        loadNotes(),
        loadStatistics(state.currentPeriod)
    ]);
}

function updateCurrentDate() {
    if ($("currentDate")) {
        $("currentDate").textContent = new Date().toLocaleDateString("en-PK", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }
}

// --- NAVIGATION ---
function navigateTo(page) {
    const validPages = ["dashboard", "sales", "expenses", "notes", "statistics", "settings"];
    if (!validPages.includes(page)) page = "dashboard";

    state.currentPage = page;

    all(".page").forEach(section => section.classList.remove("active-page"));
    const targetSection = $(`page-${page}`);
    if (targetSection) targetSection.classList.add("active-page");

    all(".nav-button").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        dashboard: "Dashboard",
        sales: "Sales",
        expenses: "Purchases",
        notes: "Notes",
        statistics: "Statistics",
        settings: "Settings"
    };

    if ($("pageTitle")) $("pageTitle").textContent = titles[page];

    closeDropdown();
    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Refresh targeted page data
    const loaders = {
        dashboard: loadDashboard,
        sales: loadSales,
        expenses: loadExpenses,
        notes: loadNotes,
        statistics: () => loadStatistics(state.currentPeriod)
    };

    if (loaders[page]) loaders[page]();
}

// --- DASHBOARD ---
async function loadDashboard() {
    try {
        const result = await api("/api/dashboard");
        const stats = result.stats || {};

        $("dashboardTodaySales").textContent = formatMoney(stats.todaySales);
        $("dashboardTodayExpenses").textContent = formatMoney(stats.todayExpenses);
        $("dashboardTodayProfit").textContent = formatMoney(stats.todayProfit);
        $("dashboardTransactions").textContent = Number(stats.totalTransactions || 0).toLocaleString();

        renderRecentActivity(result.recentActivity || []);
    } catch (error) {
        console.error("Dashboard Error:", error);
        $("recentActivity").innerHTML = emptyState("Unable to load activity.");
    }
}

function renderRecentActivity(activities) {
    const container = $("recentActivity");
    if (!activities.length) {
        container.innerHTML = emptyState("No activity recorded yet.");
        return;
    }

    container.innerHTML = activities.map(activity => {
        const isSale = activity.type === "sale";
        return `
            <div class="activity-item">
                <div class="activity-mark">
                    <span class="${isSale ? "sale-mark" : "expense-mark"}">${isSale ? "+" : "−"}</span>
                </div>
                <div class="activity-details">
                    <strong>${escapeHTML(activity.description)}</strong>
                    <small>${isSale ? "Sale" : "Purchase"} · ${formatDate(activity.created_at)}</small>
                </div>
                <strong class="activity-amount">${formatMoney(activity.amount)}</strong>
            </div>
        `;
    }).join("");
}

// --- SALES MODULE ---
async function loadSales() {
    const container = $("salesList");
    try {
        const result = await api("/api/sales?limit=100");
        renderSales(result.sales || []);
    } catch (error) {
        console.error("Sales Error:", error);
        container.innerHTML = emptyState("Unable to load sales.");
    }
}

function renderSales(sales) {
    const container = $("salesList");
    if (!sales.length) {
        container.innerHTML = emptyState("No sales have been recorded yet.");
        return;
    }

    container.innerHTML = sales.map(sale => `
        <div class="record-item">
            <div class="record-main">
                <div class="record-symbol sale-symbol">+</div>
                <div>
                    <strong>${escapeHTML(sale.description)}</strong>
                    <small>${formatDate(sale.created_at)}</small>
                </div>
            </div>
            <div class="record-actions">
                <strong class="positive-money">+${formatMoney(sale.amount)}</strong>
                <button type="button" class="delete-record" data-delete-sale="${sale.id}">Delete</button>
            </div>
        </div>
    `).join("");
}

async function createSale(event) {
    event.preventDefault();
    const amount = $("saleAmount").value;
    const description = $("saleDescription").value.trim();
    const button = event.submitter;

    if (Number(amount) <= 0) {
        showToast("Enter a valid amount.", "error");
        return;
    }

    button.disabled = true;

    try {
        await api("/api/sales", {
            method: "POST",
            body: JSON.stringify({ amount: Number(amount), description })
        });

        $("saleForm").reset();
        showToast("Sale saved successfully.", "success");
        await Promise.all([loadDashboard(), loadSales(), loadStatistics(state.currentPeriod)]);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        button.disabled = false;
    }
}

async function deleteSale(id) {
    const confirmed = await confirmAction("Delete Sale", "Are you sure you want to delete this sale?");
    if (!confirmed) return;

    try {
        await api(`/api/sales/${id}`, { method: "DELETE" });
        showToast("Sale deleted.", "success");
        await Promise.all([loadDashboard(), loadSales(), loadStatistics(state.currentPeriod)]);
    } catch (error) {
        showToast(error.message, "error");
    }
}

// --- EXPENSES MODULE ---
async function loadExpenses() {
    const container = $("expensesList");
    try {
        const result = await api("/api/expenses?limit=100");
        renderExpenses(result.expenses || []);
    } catch (error) {
        console.error("Expenses Error:", error);
        container.innerHTML = emptyState("Unable to load purchases.");
    }
}

function renderExpenses(expenses) {
    const container = $("expensesList");
    if (!expenses.length) {
        container.innerHTML = emptyState("No purchases have been recorded yet.");
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="record-item">
            <div class="record-main">
                <div class="record-symbol expense-symbol">−</div>
                <div>
                    <strong>${escapeHTML(expense.description)}</strong>
                    <small>${expense.supplier ? escapeHTML(expense.supplier) + " · " : ""}${formatDate(expense.created_at)}</small>
                </div>
            </div>
            <div class="record-actions">
                <strong class="negative-money">−${formatMoney(expense.amount)}</strong>
                <button type="button" class="delete-record" data-delete-expense="${expense.id}">Delete</button>
            </div>
        </div>
    `).join("");
}

async function createExpense(event) {
    event.preventDefault();
    const amount = $("expenseAmount").value;
    const description = $("expenseDescription").value.trim();
    const supplier = $("expenseSupplier").value.trim();
    const button = event.submitter;

    if (Number(amount) <= 0) {
        showToast("Enter a valid amount.", "error");
        return;
    }

    if (!description) {
        showToast("Enter an item or description.", "error");
        return;
    }

    button.disabled = true;

    try {
        await api("/api/expenses", {
            method: "POST",
            body: JSON.stringify({ amount: Number(amount), description, supplier })
        });

        $("expenseForm").reset();
        showToast("Purchase saved successfully.", "success");
        await Promise.all([loadDashboard(), loadExpenses(), loadStatistics(state.currentPeriod)]);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        button.disabled = false;
    }
}

async function deleteExpense(id) {
    const confirmed = await confirmAction("Delete Purchase", "Are you sure you want to delete this purchase?");
    if (!confirmed) return;

    try {
        await api(`/api/expenses/${id}`, { method: "DELETE" });
        showToast("Purchase deleted.", "success");
        await Promise.all([loadDashboard(), loadExpenses(), loadStatistics(state.currentPeriod)]);
    } catch (error) {
        showToast(error.message, "error");
    }
}

// --- NOTES MODULE ---
async function loadNotes() {
    const container = $("notesList");
    try {
        const result = await api("/api/notes?limit=100");
        renderNotes(result.notes || []);
    } catch (error) {
        console.error("Notes Error:", error);
        container.innerHTML = emptyState("Unable to load notes.");
    }
}

function renderNotes(notes) {
    const container = $("notesList");
    if (!notes.length) {
        container.innerHTML = emptyState("No notes have been saved yet.");
        return;
    }

    container.innerHTML = notes.map(note => `
        <article class="note-card">
            <div class="note-card-header">
                <span class="note-label">NOTE</span>
                <button type="button" class="delete-record" data-delete-note="${note.id}">Delete</button>
            </div>
            <p class="note-content">${escapeHTML(note.text)}</p>
            <div class="note-footer">
                <span>${formatDate(note.updated_at || note.created_at)}</span>
            </div>
        </article>
    `).join("");
}

async function createNote(event) {
    event.preventDefault();
    const text = $("noteText").value.trim();
    const button = event.submitter;

    if (!text) {
        showToast("Write something first.", "error");
        return;
    }

    button.disabled = true;

    try {
        await api("/api/notes", {
            method: "POST",
            body: JSON.stringify({ text })
        });

        $("noteForm").reset();
        showToast("Note saved.", "success");
        await loadNotes();
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        button.disabled = false;
    }
}

async function deleteNote(id) {
    const confirmed = await confirmAction("Delete Note", "Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
        await api(`/api/notes/${id}`, { method: "DELETE" });
        showToast("Note deleted.", "success");
        await loadNotes();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// --- STATISTICS MODULE ---
async function loadStatistics(period = "month") {
    state.currentPeriod = period;

    try {
        const result = await api(`/api/statistics?period=${encodeURIComponent(period)}`);
        const stats = result.statistics || {};

        $("statisticsSales").textContent = formatMoney(stats.sales);
        $("statisticsExpenses").textContent = formatMoney(stats.expenses);
        $("statisticsProfit").textContent = formatMoney(stats.profit);
        $("statisticsTransactions").textContent = Number(stats.transactions || 0).toLocaleString();

        updatePeriodButtons(period);
        await loadDailyBreakdown();
    } catch (error) {
        console.error("Statistics Error:", error);
        $("dailyBreakdown").innerHTML = emptyState("Unable to load statistics.");
    }
}

function updatePeriodButtons(period) {
    all(".period-button").forEach(button => {
        button.classList.toggle("active", button.dataset.period === period);
    });
}

async function loadDailyBreakdown() {
    try {
        const result = await api("/api/statistics/daily?days=7");
        renderDailyBreakdown(result.breakdown || []);
    } catch {
        $("dailyBreakdown").innerHTML = emptyState("Daily breakdown will appear here.");
    }
}

function renderDailyBreakdown(breakdown) {
    const container = $("dailyBreakdown");
    if (!breakdown.length) {
        container.innerHTML = emptyState("No daily data available.");
        return;
    }

    container.innerHTML = breakdown.map(day => `
        <div class="breakdown-row">
            <div class="breakdown-date">
                <strong>${formatShortDate(day.day)}</strong>
            </div>
            <div class="breakdown-values">
                <span>Sales: <strong>${formatMoney(day.sales)}</strong></span>
                <span>Purchases: <strong>${formatMoney(day.expenses)}</strong></span>
                <span>Profit: <strong>${formatMoney(day.profit)}</strong></span>
            </div>
        </div>
    `).join("");
}

// --- SETTINGS / BACKUP ACTIONS ---
async function exportData() {
    try {
        const response = await fetch("/api/export", { credentials: "same-origin" });
        if (response.status === 401) {
            lockApplication();
            return;
        }
        if (!response.ok) throw new Error("Could not export data.");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `arzoo-restaurant-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        showToast("Backup exported successfully.", "success");
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function deleteAllData() {
    const confirmed = await confirmAction(
        "Delete Everything",
        "This will permanently remove all sales, purchases and notes. Continue?"
    );

    if (!confirmed) return;

    try {
        await api("/api/data/all", { method: "DELETE" });
        showToast("All restaurant data has been deleted.", "success");
        await loadApplication();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// --- CONFIRMATION MODAL ---
let confirmResolver = null;

function confirmAction(title, message) {
    return new Promise(resolve => {
        confirmResolver = resolve;
        $("confirmTitle").textContent = title;
        $("confirmMessage").textContent = message;
        $("confirmModal").classList.remove("hidden");
    });
}

function closeConfirm(result) {
    $("confirmModal").classList.add("hidden");
    if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
    }
}

// --- DROPDOWN MENU ---
function toggleDropdown() {
    const menu = $("dropdownMenu");
    const button = $("menuButton");
    const hidden = menu.classList.contains("hidden");

    menu.classList.toggle("hidden");
    button.setAttribute("aria-expanded", String(hidden));
}

function closeDropdown() {
    $("dropdownMenu")?.classList.add("hidden");
    $("menuButton")?.setAttribute("aria-expanded", "false");
}

// --- MOBILE SIDEBAR ---
function toggleMobileSidebar() {
    $("sidebar")?.classList.toggle("mobile-open");
}

function closeMobileSidebar() {
    $("sidebar")?.classList.remove("mobile-open");
}

// --- UTILITY VIEWS ---
function emptyState(message) {
    return `<div class="empty-state"><p>${escapeHTML(message)}</p></div>`;
}

// --- EVENT HANDLERS DELEGATION ---
function setupEvents() {
    // Forms
    $("loginForm")?.addEventListener("submit", handleLogin);
    $("saleForm")?.addEventListener("submit", createSale);
    $("expenseForm")?.addEventListener("submit", createExpense);
    $("noteForm")?.addEventListener("submit", createNote);

    // Sidebar navigation
    all(".nav-button").forEach(button => {
        button.addEventListener("click", () => navigateTo(button.dataset.page));
    });

    // Quick target navigation
    all("[data-page-target]").forEach(button => {
        button.addEventListener("click", () => navigateTo(button.dataset.pageTarget));
    });

    // Top Header Menu
    $("menuButton")?.addEventListener("click", event => {
        event.stopPropagation();
        toggleDropdown();
    });

    $("dropdownMenu")?.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button) return;

        const action = button.dataset.action;
        if (["notes", "statistics", "settings"].includes(action)) {
            navigateTo(action);
        } else if (action === "lock") {
            closeDropdown();
            lockDashboard();
        }
    });

    document.addEventListener("click", event => {
        const menu = $("dropdownMenu");
        const button = $("menuButton");
        if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
            closeDropdown();
        }
    });

    // Statistics Period Selector
    all(".period-button").forEach(button => {
        button.addEventListener("click", () => loadStatistics(button.dataset.period));
    });

    // Item Deletion via Global Delegation
    document.addEventListener("click", event => {
        const saleBtn = event.target.closest("[data-delete-sale]");
        if (saleBtn) return deleteSale(saleBtn.dataset.deleteSale);

        const expenseBtn = event.target.closest("[data-delete-expense]");
        if (expenseBtn) return deleteExpense(expenseBtn.dataset.deleteExpense);

        const noteBtn = event.target.closest("[data-delete-note]");
        if (noteBtn) return deleteNote(noteBtn.dataset.deleteNote);
    });

    // Settings actions
    $("exportDataButton")?.addEventListener("click", exportData);
    $("deleteAllDataButton")?.addEventListener("click", deleteAllData);

    // Modal Events
    $("confirmCancel")?.addEventListener("click", () => closeConfirm(false));
    $("confirmProceed")?.addEventListener("click", () => closeConfirm(true));
    $("confirmModal")?.querySelector(".modal-overlay")?.addEventListener("click", () => closeConfirm(false));

    // Mobile Navigation
    $("mobileMenuButton")?.addEventListener("click", toggleMobileSidebar);

    // Global Keybinds
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeDropdown();
            closeConfirm(false);
            closeMobileSidebar();
        }
    });
}

// --- INITIALIZATION ---
function initialize() {
    applyConfig();
    setupEvents();
    checkAuthentication();
}

document.addEventListener("DOMContentLoaded", initialize);
