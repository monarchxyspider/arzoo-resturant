"use strict";

/*
============================================================
 ARZOO RESTAURANT
 FRONTEND APPLICATION
============================================================

 This file communicates with server.js.

 IMPORTANT:
 No password is stored here.

 Authentication:
     /api/auth/login

 Data:
     /api/dashboard
     /api/sales
     /api/expenses
     /api/notes
     /api/statistics

 Configuration:
     config.js

============================================================
*/


// ==========================================================
// CONFIGURATION CHECK
// ==========================================================

if (
    typeof CONFIG === "undefined"
) {

    throw new Error(
        "config.js was not loaded."
    );

}


// ==========================================================
// APPLICATION STATE
// ==========================================================

const state = {

    currentPage:
        "dashboard",

    currentPeriod:
        "month",

    authenticated:
        false,

    loading:
        false

};


// ==========================================================
// DOM HELPER
// ==========================================================

function $(id) {

    return document.getElementById(id);

}


function all(selector) {

    return document.querySelectorAll(
        selector
    );

}


// ==========================================================
// CONFIG APPLICATION
// ==========================================================

function applyConfig() {

    /*
    ----------------------------------------------------------
    Restaurant name
    ----------------------------------------------------------
    */

    const restaurantName =
        CONFIG.restaurantName ||
        "Arzoo Restaurant";


    $("loginRestaurantName")
        .textContent =
        restaurantName;


    $("brandName")
        .textContent =
        restaurantName;


    $("headerRestaurantName")
        .textContent =
        restaurantName;


    $("settingsRestaurantName")
        .textContent =
        restaurantName;


    /*
    ----------------------------------------------------------
    Currency
    ----------------------------------------------------------
    */

    const currency =
        CONFIG.currency ||
        "PKR";


    $("settingsCurrency")
        .textContent =
        currency;


    /*
    ----------------------------------------------------------
    Theme
    ----------------------------------------------------------
    */

    if (
        CONFIG.theme
    ) {

        const root =
            document.documentElement;


        const themeMap = {

            primary:
                "--primary",

            primaryDark:
                "--primary-dark",

            background:
                "--background",

            card:
                "--card",

            text:
                "--text",

            muted:
                "--muted",

            danger:
                "--danger",

            success:
                "--success"

        };


        Object.entries(
            themeMap
        ).forEach(
            ([key, variable]) => {

                if (
                    CONFIG.theme[key]
                ) {

                    root.style.setProperty(
                        variable,
                        CONFIG.theme[key]
                    );

                }

            }
        );

    }


    /*
    ----------------------------------------------------------
    Custom images / emojis
    ----------------------------------------------------------

    We NEVER use hard-coded emoji characters for the
    dashboard icons.

    config.js supplies the image URLs.
    ----------------------------------------------------------
    */

    const icons =
        CONFIG.emojis || {};


    setImage(
        "loginLogo",
        icons.restaurant
    );

    setImage(
        "brandLogo",
        icons.restaurant
    );


    setImage(
        "navDashboardIcon",
        icons.dashboard
    );

    setImage(
        "navSalesIcon",
        icons.sales
    );

    setImage(
        "navExpenseIcon",
        icons.expense
    );

    setImage(
        "navNotesIcon",
        icons.notes
    );

    setImage(
        "navStatisticsIcon",
        icons.statistics
    );

    setImage(
        "navSettingsIcon",
        icons.settings
    );


    setImage(
        "menuNotesIcon",
        icons.notes
    );

    setImage(
        "menuStatisticsIcon",
        icons.statistics
    );

    setImage(
        "menuSettingsIcon",
        icons.settings
    );


    setImage(
        "statSalesIcon",
        icons.sales
    );

    setImage(
        "statExpenseIcon",
        icons.expense
    );

    setImage(
        "statProfitIcon",
        icons.profit
    );

    setImage(
        "statTransactionIcon",
        icons.transactions
    );


    setImage(
        "quickSalesIcon",
        icons.sales
    );

    setImage(
        "quickExpenseIcon",
        icons.expense
    );

    setImage(
        "quickNotesIcon",
        icons.notes
    );


    setImage(
        "statisticsSalesIcon",
        icons.sales
    );

    setImage(
        "statisticsExpenseIcon",
        icons.expense
    );

    setImage(
        "statisticsProfitIcon",
        icons.profit
    );

    setImage(
        "statisticsTransactionIcon",
        icons.transactions
    );

}


/*
------------------------------------------------------------
 Safe image setter
------------------------------------------------------------
*/

function setImage(
    id,
    source
) {

    const element =
        $(id);


    if (!element) {
        return;
    }


    if (
        typeof source === "string" &&
        source.trim()
    ) {

        element.src =
            source.trim();

        element.style.display =
            "block";

    } else {

        /*
        If config has no image URL, hide the image rather
        than displaying a normal emoji.
        */

        element.style.display =
            "none";

    }

}


// ==========================================================
// API REQUEST HELPER
// ==========================================================

async function api(
    url,
    options = {}
) {

    const defaultHeaders = {

        "Accept":
            "application/json"

    };


    if (
        options.body &&
        !(
            options.body
            instanceof FormData
        )
    ) {

        defaultHeaders[
            "Content-Type"
        ] =
            "application/json";

    }


    const response =
        await fetch(
            url,
            {

                ...options,

                headers: {

                    ...defaultHeaders,

                    ...(options.headers || {})

                },

                credentials:
                    "same-origin"

            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data =
            null;

    }


    if (
        response.status === 401
    ) {

        state.authenticated =
            false;


        lockApplication(
            false
        );


        throw new Error(
            "Your session has expired."
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(
            data?.error ||
            "Something went wrong."
        );

    }


    return data;

}


// ==========================================================
// FORMATTERS
// ==========================================================

function formatMoney(
    value
) {

    const amount =
        Number(value) || 0;


    const currency =
        CONFIG.currency ||
        "PKR";


    return (
        currency +
        " " +
        amount.toLocaleString(
            "en-PK",
            {
                minimumFractionDigits:
                    amount % 1 === 0
                        ? 0
                        : 2,

                maximumFractionDigits:
                    2
            }
        )
    );

}


function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleString(
        "en-PK",
        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );

}


function formatShortDate(
    value
) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-PK",
        {

            day:
                "numeric",

            month:
                "short"

        }
    );

}


// ==========================================================
// HTML ESCAPING
// ==========================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


// ==========================================================
// TOAST
// ==========================================================

let toastTimer;


function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");


    if (!container) {
        return;
    }


    clearTimeout(
        toastTimer
    );


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.textContent =
        message;


    container.innerHTML =
        "";


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    250
                );

            },
            3000
        );

}


// ==========================================================
// LOGIN
// ==========================================================

async function checkAuthentication() {

    try {

        const result =
            await api(
                "/api/auth/status"
            );


        if (
            result.authenticated
        ) {

            state.authenticated =
                true;


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

    $("loginScreen")
        .classList.remove(
            "hidden"
        );


    $("app")
        .classList.add(
            "hidden"
        );


    setTimeout(
        () => {

            $("passwordInput")
                ?.focus();

        },
        100
    );

}


function showApplication() {

    $("loginScreen")
        .classList.add(
            "hidden"
        );


    $("app")
        .classList.remove(
            "hidden"
        );

}


async function handleLogin(
    event
) {

    event.preventDefault();


    const password =
        $("passwordInput")
            .value;


    const error =
        $("loginError");


    const button =
        $("loginButton");


    error.textContent =
        "";


    if (!password) {

        error.textContent =
            "Please enter your password.";

        return;

    }


    button.disabled =
        true;


    button.classList.add(
        "loading"
    );


    try {

        const result =
            await api(
                "/api/auth/login",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            password
                        })

                }
            );


        if (
            result.success
        ) {

            state.authenticated =
                true;


            $("passwordInput")
                .value =
                "";


            showApplication();


            await loadApplication();


            showToast(
                "Dashboard unlocked.",
                "success"
            );

        }

    } catch (error) {

        error =
            error instanceof Error
                ? error
                : new Error(
                    "Login failed."
                );


        $("loginError")
            .textContent =
            error.message;

    } finally {

        button.disabled =
            false;

        button.classList.remove(
            "loading"
        );

    }

}


// ==========================================================
// LOCK / LOGOUT
// ==========================================================

async function lockDashboard() {

    try {

        await api(
            "/api/auth/logout",
            {
                method:
                    "POST"
            }
        );

    } catch {
        // Session may already be gone.
    }


    lockApplication(
        true
    );

}


function lockApplication(
    showMessage = true
) {

    state.authenticated =
        false;


    $("app")
        .classList.add(
            "hidden"
        );


    $("loginScreen")
        .classList.remove(
            "hidden"
        );


    $("passwordInput")
        .value =
        "";


    if (showMessage) {

        $("loginError")
            .textContent =
            "Dashboard locked.";

    }


    setTimeout(
        () => {

            $("passwordInput")
                ?.focus();

        },
        100
    );

}


// ==========================================================
// LOAD APPLICATION
// ==========================================================

async function loadApplication() {

    updateCurrentDate();


    await Promise.allSettled([

        loadDashboard(),

        loadSales(),

        loadExpenses(),

        loadNotes(),

        loadStatistics(
            state.currentPeriod
        )

    ]);

}


// ==========================================================
// DATE
// ==========================================================

function updateCurrentDate() {

    const now =
        new Date();


    $("currentDate")
        .textContent =
        now.toLocaleDateString(
            "en-PK",
            {

                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "short",

                year:
                    "numeric"

            }
        );

}


// ==========================================================
// NAVIGATION
// ==========================================================

function navigateTo(
    page
) {

    const validPages = [

        "dashboard",

        "sales",

        "expenses",

        "notes",

        "statistics",

        "settings"

    ];


    if (
        !validPages.includes(
            page
        )
    ) {

        page =
            "dashboard";

    }


    state.currentPage =
        page;


    all(".page")
        .forEach(
            section => {

                section.classList.remove(
                    "active-page"
                );

            }
        );


    const target =
        $(
            `page-${page}`
        );


    /*
    IDs are page-dashboard, page-sales, etc.
    */

    const targetSection =
        document.getElementById(
            `page-${page}`
        );


    if (
        targetSection
    ) {

        targetSection.classList.add(
            "active-page"
        );

    }


    all(".nav-button")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page === page
                );

            }
        );


    const titles = {

        dashboard:
            "Dashboard",

        sales:
            "Sales",

        expenses:
            "Purchases",

        notes:
            "Notes",

        statistics:
            "Statistics",

        settings:
            "Settings"

    };


    $("pageTitle")
        .textContent =
        titles[page];


    closeDropdown();

    closeMobileSidebar();

    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );


    /*
    Refresh data when entering a page.
    */

    if (
        page === "dashboard"
    ) {

        loadDashboard();

    }


    if (
        page === "sales"
    ) {

        loadSales();

    }


    if (
        page === "expenses"
    ) {

        loadExpenses();

    }


    if (
        page === "notes"
    ) {

        loadNotes();

    }


    if (
        page === "statistics"
    ) {

        loadStatistics(
            state.currentPeriod
        );

    }

}


// ==========================================================
// DASHBOARD
// ==========================================================

async function loadDashboard() {

    try {

        const result =
            await api(
                "/api/dashboard"
            );


        const stats =
            result.stats || {};


        $("dashboardTodaySales")
            .textContent =
            formatMoney(
                stats.todaySales
            );


        $("dashboardTodayExpenses")
            .textContent =
            formatMoney(
                stats.todayExpenses
            );


        $("dashboardTodayProfit")
            .textContent =
            formatMoney(
                stats.todayProfit
            );


        $("dashboardTransactions")
            .textContent =
            Number(
                stats.totalTransactions || 0
            )
            .toLocaleString();


        renderRecentActivity(
            result.recentActivity || []
        );

    } catch (error) {

        console.error(
            "Dashboard:",
            error
        );

        $("recentActivity")
            .innerHTML =
            emptyState(
                "Unable to load activity."
            );

    }

}


// ==========================================================
// RECENT ACTIVITY
// ==========================================================

function renderRecentActivity(
    activities
) {

    const container =
        $("recentActivity");


    if (
        !activities.length
    ) {

        container.innerHTML =
            emptyState(
                "No activity recorded yet."
            );

        return;

    }


    container.innerHTML =
        activities
            .map(
                activity => {

                    const isSale =
                        activity.type ===
                        "sale";


                    const label =
                        isSale
                            ? "Sale"
                            : "Purchase";


                    const amount =
                        formatMoney(
                            activity.amount
                        );


                    return `
                        <div class="activity-item">

                            <div class="activity-mark">

                                <span class="${
                                    isSale
                                        ? "sale-mark"
                                        : "expense-mark"
                                }">

                                    ${isSale ? "+" : "−"}

                                </span>

                            </div>

                            <div class="activity-details">

                                <strong>
                                    ${escapeHTML(
                                        activity.description
                                    )}
                                </strong>

                                <small>
                                    ${label}
                                    ·
                                    ${formatDate(
                                        activity.created_at
                                    )}
                                </small>

                            </div>

                            <strong class="activity-amount">
                                ${amount}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");

}


// ==========================================================
// SALES
// ==========================================================

async function loadSales() {

    const container =
        $("salesList");


    try {

        const result =
            await api(
                "/api/sales?limit=100"
            );


        renderSales(
            result.sales || []
        );

    } catch (error) {

        console.error(
            "Sales:",
            error
        );


        container.innerHTML =
            emptyState(
                "Unable to load sales."
            );

    }

}


function renderSales(
    sales
) {

    const container =
        $("salesList");


    if (
        !sales.length
    ) {

        container.innerHTML =
            emptyState(
                "No sales have been recorded yet."
            );

        return;

    }


    container.innerHTML =
        sales
            .map(
                sale => `

                    <div class="record-item">

                        <div class="record-main">

                            <div class="record-symbol sale-symbol">
                                +
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        sale.description
                                    )}
                                </strong>

                                <small>
                                    ${formatDate(
                                        sale.created_at
                                    )}
                                </small>

                            </div>

                        </div>

                        <div class="record-actions">

                            <strong class="positive-money">
                                +${formatMoney(
                                    sale.amount
                                )}
                            </strong>

                            <button
                                type="button"
                                class="delete-record"
                                data-delete-sale="${sale.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


// ==========================================================
// CREATE SALE
// ==========================================================

async function createSale(
    event
) {

    event.preventDefault();


    const amount =
        $("saleAmount")
            .value;


    const description =
        $("saleDescription")
            .value
            .trim();


    const button =
        event.submitter;


    if (
        Number(amount) <= 0
    ) {

        showToast(
            "Enter a valid amount.",
            "error"
        );

        return;

    }


    button.disabled =
        true;


    try {

        await api(
            "/api/sales",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        amount:
                            Number(amount),

                        description

                    })

            }
        );


        $("saleForm")
            .reset();


        showToast(
            "Sale saved successfully.",
            "success"
        );


        await Promise.all([

            loadDashboard(),

            loadSales(),

            loadStatistics(
                state.currentPeriod
            )

        ]);

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

    }

}


// ==========================================================
// DELETE SALE
// ==========================================================

async function deleteSale(
    id
) {

    const confirmed =
        await confirmAction(
            "Delete Sale",
            "Are you sure you want to delete this sale?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            `/api/sales/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        showToast(
            "Sale deleted.",
            "success"
        );


        await Promise.all([

            loadDashboard(),

            loadSales(),

            loadStatistics(
                state.currentPeriod
            )

        ]);

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


// ==========================================================
// EXPENSES
// ==========================================================

async function loadExpenses() {

    const container =
        $("expensesList");


    try {

        const result =
            await api(
                "/api/expenses?limit=100"
            );


        renderExpenses(
            result.expenses || []
        );

    } catch (error) {

        console.error(
            "Expenses:",
            error
        );


        container.innerHTML =
            emptyState(
                "Unable to load purchases."
            );

    }

}


function renderExpenses(
    expenses
) {

    const container =
        $("expensesList");


    if (
        !expenses.length
    ) {

        container.innerHTML =
            emptyState(
                "No purchases have been recorded yet."
            );

        return;

    }


    container.innerHTML =
        expenses
            .map(
                expense => `

                    <div class="record-item">

                        <div class="record-main">

                            <div class="record-symbol expense-symbol">
                                −
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        expense.description
                                    )}
                                </strong>

                                <small>

                                    ${expense.supplier
                                        ? escapeHTML(
                                            expense.supplier
                                        ) + " · "
                                        : ""
                                    }

                                    ${formatDate(
                                        expense.created_at
                                    )}

                                </small>

                            </div>

                        </div>

                        <div class="record-actions">

                            <strong class="negative-money">
                                −${formatMoney(
                                    expense.amount
                                )}
                            </strong>

                            <button
                                type="button"
                                class="delete-record"
                                data-delete-expense="${expense.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `
            )
            .join("");

}


// ==========================================================
// CREATE EXPENSE
// ==========================================================

async function createExpense(
    event
) {

    event.preventDefault();


    const amount =
        $("expenseAmount")
            .value;


    const description =
        $("expenseDescription")
            .value
            .trim();


    const supplier =
        $("expenseSupplier")
            .value
            .trim();


    const button =
        event.submitter;


    if (
        Number(amount) <= 0
    ) {

        showToast(
            "Enter a valid amount.",
            "error"
        );

        return;

    }


    if (
        !description
    ) {

        showToast(
            "Enter an item or description.",
            "error"
        );

        return;

    }


    button.disabled =
        true;


    try {

        await api(
            "/api/expenses",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        amount:
                            Number(amount),

                        description,

                        supplier

                    })

            }
        );


        $("expenseForm")
            .reset();


        showToast(
            "Purchase saved successfully.",
            "success"
        );


        await Promise.all([

            loadDashboard(),

            loadExpenses(),

            loadStatistics(
                state.currentPeriod
            )

        ]);

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

    }

}


// ==========================================================
// DELETE EXPENSE
// ==========================================================

async function deleteExpense(
    id
) {

    const confirmed =
        await confirmAction(
            "Delete Purchase",
            "Are you sure you want to delete this purchase?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            `/api/expenses/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        showToast(
            "Purchase deleted.",
            "success"
        );


        await Promise.all([

            loadDashboard(),

            loadExpenses(),

            loadStatistics(
                state.currentPeriod
            )

        ]);

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


// ==========================================================
// NOTES
// ==========================================================

async function loadNotes() {

    const container =
        $("notesList");


    try {

        const result =
            await api(
                "/api/notes?limit=100"
            );


        renderNotes(
            result.notes || []
        );

    } catch (error) {

        console.error(
            "Notes:",
            error
        );


        container.innerHTML =
            emptyState(
                "Unable to load notes."
            );

    }

}


function renderNotes(
    notes
) {

    const container =
        $("notesList");


    if (
        !notes.length
    ) {

        container.innerHTML =
            emptyState(
                "No notes have been saved yet."
            );

        return;

    }


    container.innerHTML =
        notes
            .map(
                note => `

                    <article class="note-card">

                        <div class="note-card-header">

                            <span class="note-label">
                                NOTE
                            </span>

                            <button
                                type="button"
                                class="delete-record"
                                data-delete-note="${note.id}"
                            >
                                Delete
                            </button>

                        </div>

                        <p class="note-content">
                            ${escapeHTML(
                                note.text
                            )}
                        </p>

                        <div class="note-footer">

                            <span>
                                ${formatDate(
                                    note.updated_at ||
                                    note.created_at
                                )}
                            </span>

                        </div>

                    </article>

                `
            )
            .join("");

}


// ==========================================================
// CREATE NOTE
// ==========================================================

async function createNote(
    event
) {

    event.preventDefault();


    const text =
        $("noteText")
            .value
            .trim();


    const button =
        event.submitter;


    if (
        !text
    ) {

        showToast(
            "Write something first.",
            "error"
        );

        return;

    }


    button.disabled =
        true;


    try {

        await api(
            "/api/notes",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({
                        text
                    })

            }
        );


        $("noteForm")
            .reset();


        showToast(
            "Note saved.",
            "success"
        );


        await loadNotes();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

    }

}


// ==========================================================
// DELETE NOTE
// ==========================================================

async function deleteNote(
    id
) {

    const confirmed =
        await confirmAction(
            "Delete Note",
            "Are you sure you want to delete this note?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            `/api/notes/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        showToast(
            "Note deleted.",
            "success"
        );


        await loadNotes();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


// ==========================================================
// STATISTICS
// ==========================================================

async function loadStatistics(
    period = "month"
) {

    state.currentPeriod =
        period;


    try {

        const result =
            await api(
                `/api/statistics?period=${encodeURIComponent(
                    period
                )}`
            );


        const stats =
            result.statistics || {};


        $("statisticsSales")
            .textContent =
            formatMoney(
                stats.sales
            );


        $("statisticsExpenses")
            .textContent =
            formatMoney(
                stats.expenses
            );


        $("statisticsProfit")
            .textContent =
            formatMoney(
                stats.profit
            );


        $("statisticsTransactions")
            .textContent =
            Number(
                stats.transactions || 0
            )
            .toLocaleString();


        updatePeriodButtons(
            period
        );


        await loadDailyBreakdown();

    } catch (error) {

        console.error(
            "Statistics:",
            error
        );


        $("dailyBreakdown")
            .innerHTML =
            emptyState(
                "Unable to load statistics."
            );

    }

}


function updatePeriodButtons(
    period
) {

    all(".period-button")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.period === period
                );

            }
        );

}


async function loadDailyBreakdown() {

    /*
    The database module already exposes a daily breakdown
    function. We need an API endpoint for it.

    If the endpoint isn't available yet, we simply show a
    useful empty state instead of breaking the dashboard.
    */

    try {

        const result =
            await api(
                "/api/statistics/daily?days=7"
            );


        renderDailyBreakdown(
            result.breakdown || []
        );

    } catch {

        /*
        This is intentionally quiet.

        The current server.js can be extended with the daily
        endpoint when the chart section is finalized.
        */

        $("dailyBreakdown")
            .innerHTML =
            emptyState(
                "Daily breakdown will appear here."
            );

    }

}


function renderDailyBreakdown(
    breakdown
) {

    const container =
        $("dailyBreakdown");


    if (
        !breakdown.length
    ) {

        container.innerHTML =
            emptyState(
                "No daily data available."
            );

        return;

    }


    container.innerHTML =
        breakdown
            .map(
                day => `

                    <div class="breakdown-row">

                        <div class="breakdown-date">

                            <strong>
                                ${formatShortDate(
                                    day.day
                                )}
                            </strong>

                        </div>

                        <div class="breakdown-values">

                            <span>
                                Sales:
                                <strong>
                                    ${formatMoney(
                                        day.sales
                                    )}
                                </strong>
                            </span>

                            <span>
                                Purchases:
                                <strong>
                                    ${formatMoney(
                                        day.expenses
                                    )}
                                </strong>
                            </span>

                            <span>
                                Profit:
                                <strong>
                                    ${formatMoney(
                                        day.profit
                                    )}
                                </strong>
                            </span>

                        </div>

                    </div>

                `
            )
            .join("");

}


// ==========================================================
// EXPORT
// ==========================================================

async function exportData() {

    try {

        const response =
            await fetch(
                "/api/export",
                {
                    credentials:
                        "same-origin"
                }
            );


        if (
            response.status === 401
        ) {

            lockApplication();

            return;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                "Could not export data."
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `arzoo-restaurant-backup-${
                new Date()
                    .toISOString()
                    .slice(0, 10)
            }.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            "Backup exported successfully.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


// ==========================================================
// DELETE ALL DATA
// ==========================================================

async function deleteAllData() {

    const confirmed =
        await confirmAction(
            "Delete Everything",
            "This will permanently remove all sales, purchases and notes. Continue?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await api(
            "/api/data/all",
            {
                method:
                    "DELETE"
            }
        );


        showToast(
            "All restaurant data has been deleted.",
            "success"
        );


        await loadApplication();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


// ==========================================================
// CONFIRMATION MODAL
// ==========================================================

let confirmResolver =
    null;


function confirmAction(
    title,
    message
) {

    return new Promise(
        resolve => {

            confirmResolver =
                resolve;


            $("confirmTitle")
                .textContent =
                title;


            $("confirmMessage")
                .textContent =
                message;


            $("confirmModal")
                .classList.remove(
                    "hidden"
                );

        }
    );

}


function closeConfirm(
    result
) {

    $("confirmModal")
        .classList.add(
            "hidden"
        );


    if (
        confirmResolver
    ) {

        confirmResolver(
            result
        );

        confirmResolver =
            null;

    }

}


// ==========================================================
// DROPDOWN MENU
// ==========================================================

function toggleDropdown() {

    const menu =
        $("dropdownMenu");


    const button =
        $("menuButton");


    const hidden =
        menu.classList.contains(
            "hidden"
        );


    menu.classList.toggle(
        "hidden"
    );


    button.setAttribute(
        "aria-expanded",
        String(hidden)
    );

}


function closeDropdown() {

    $("dropdownMenu")
        .classList.add(
            "hidden"
        );


    $("menuButton")
        .setAttribute(
            "aria-expanded",
            "false"
        );

}


// ==========================================================
// MOBILE SIDEBAR
// ==========================================================

function toggleMobileSidebar() {

    $("sidebar")
        .classList.toggle(
            "mobile-open"
        );

}


function closeMobileSidebar() {

    $("sidebar")
        .classList.remove(
            "mobile-open"
        );

}


// ==========================================================
// EMPTY STATE
// ==========================================================

function emptyState(
    message
) {

    return `
        <div class="empty-state">

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;

}


// ==========================================================
// EVENT DELEGATION
// ==========================================================

function setupEvents() {

    /*
    ----------------------------------------------------------
    Login
    ----------------------------------------------------------
    */

    $("loginForm")
        .addEventListener(
            "submit",
            handleLogin
        );


    /*
    ----------------------------------------------------------
    Sidebar navigation
    ----------------------------------------------------------
    */

    all(".nav-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        navigateTo(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    /*
    ----------------------------------------------------------
    Quick page buttons
    ----------------------------------------------------------
    */

    all(
        "[data-page-target]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    navigateTo(
                        button.dataset.pageTarget
                    );

                }
            );

        }
    );


    /*
    ----------------------------------------------------------
    Three-dot menu
    ----------------------------------------------------------
    */

    $("menuButton")
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleDropdown();

            }
        );


    $("dropdownMenu")
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.action;


                if (
                    action === "notes"
                ) {

                    navigateTo(
                        "notes"
                    );

                }


                if (
                    action === "statistics"
                ) {

                    navigateTo(
                        "statistics"
                    );

                }


                if (
                    action === "settings"
                ) {

                    navigateTo(
                        "settings"
                    );

                }


                if (
                    action === "lock"
                ) {

                    closeDropdown();

                    lockDashboard();

                }

            }
        );


    /*
    ----------------------------------------------------------
    Close dropdown outside click
    ----------------------------------------------------------
    */

    document.addEventListener(
        "click",
        event => {

            const menu =
                $("dropdownMenu");


            const button =
                $("menuButton");


            if (
                !menu.contains(
                    event.target
                ) &&
                !button.contains(
                    event.target
                )
            ) {

                closeDropdown();

            }

        }
    );


    /*
    ----------------------------------------------------------
    Forms
    ----------------------------------------------------------
    */

    $("saleForm")
        .addEventListener(
            "submit",
            createSale
        );


    $("expenseForm")
        .addEventListener(
            "submit",
            createExpense
        );


    $("noteForm")
        .addEventListener(
            "submit",
            createNote
        );


    /*
    ----------------------------------------------------------
    Period buttons
    ----------------------------------------------------------
    */

    all(".period-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        loadStatistics(
                            button.dataset.period
                        );

                    }
                );

            }
        );


    /*
    ----------------------------------------------------------
    Delete buttons through event delegation
    ----------------------------------------------------------
    */

    document.addEventListener(
        "click",
        event => {

            const saleButton =
                event.target.closest(
                    "[data-delete-sale]"
                );


            if (saleButton) {

                deleteSale(
                    saleButton.dataset.deleteSale
                );

                return;

            }


            const expenseButton =
                event.target.closest(
                    "[data-delete-expense]"
                );


            if (expenseButton) {

                deleteExpense(
                    expenseButton.dataset.deleteExpense
                );

                return;

            }


            const noteButton =
                event.target.closest(
                    "[data-delete-note]"
                );


            if (noteButton) {

                deleteNote(
                    noteButton.dataset.deleteNote
                );

                return;

            }

        }
    );


    /*
    ----------------------------------------------------------
    Settings
    ----------------------------------------------------------
    */

    $("exportDataButton")
        .addEventListener(
            "click",
            exportData
        );


    $("deleteAllDataButton")
        .addEventListener(
            "click",
            deleteAllData
        );


    /*
    ----------------------------------------------------------
    Confirmation modal
    ----------------------------------------------------------
    */

    $("confirmCancel")
        .addEventListener(
            "click",
            () => {

                closeConfirm(
                    false
                );

            }
        );


    $("confirmProceed")
        .addEventListener(
            "click",
            () => {

                closeConfirm(
                    true
                );

            }
        );


    $("confirmModal")
        .querySelector(
            ".modal-overlay"
        )
        .addEventListener(
            "click",
            () => {

                closeConfirm(
                    false
                );

            }
        );


    /*
    ----------------------------------------------------------
    Mobile menu
    ----------------------------------------------------------
    */

    $("mobileMenuButton")
        .addEventListener(
            "click",
            toggleMobileSidebar
        );


    /*
    ----------------------------------------------------------
    Escape key
    ----------------------------------------------------------
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeDropdown();

                closeConfirm(
                    false
                );

                closeMobileSidebar();

            }

        }
    );

}


// ==========================================================
// INITIALIZE
// ==========================================================

function initialize() {

    applyConfig();

    setupEvents();

    checkAuthentication();

}


// Start application.

document.addEventListener(
    "DOMContentLoaded",
    initialize
);