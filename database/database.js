"use strict";

/*
============================================================
 ARZOO RESTAURANT
 DATABASE ENGINE
============================================================

 Database:
    SQLite

 File:
    database/database.js

 This module handles:

    • Database creation
    • Table creation
    • Sales
    • Expenses / purchases
    • Notes
    • Dashboard statistics
    • Daily statistics
    • Weekly statistics
    • Monthly statistics
    • Yearly statistics
    • Recent activity
    • Data export
    • Complete data deletion

 SQLite is intentionally used because it is:
    • Persistent
    • Reliable
    • Easy to backup
    • Low maintenance
    • Perfect for a single restaurant
    • Does not require another database server

============================================================
*/

const fs = require("fs");
const path = require("path");

const Database =
    require("better-sqlite3");


// ============================================================
// DIRECTORIES
// ============================================================

const databaseDirectory =
    path.join(
        __dirname
    );


// Make sure database directory exists.

if (
    !fs.existsSync(
        databaseDirectory
    )
) {

    fs.mkdirSync(
        databaseDirectory,
        {
            recursive: true
        }
    );

}


// ============================================================
// DATABASE FILE
// ============================================================

const databasePath =
    path.join(
        databaseDirectory,
        "arzoo-restaurant.db"
    );


const db =
    new Database(
        databasePath
    );


// ============================================================
// SQLITE SETTINGS
// ============================================================

/*
 WAL mode allows SQLite to safely handle reads and writes
 while keeping the database responsive.
*/

db.pragma(
    "journal_mode = WAL"
);


/*
 Foreign keys make relationships safer.
*/

db.pragma(
    "foreign_keys = ON"
);


/*
 SQLite waits briefly if the database is temporarily locked.
*/

db.pragma(
    "busy_timeout = 5000"
);


/*
 Synchronous NORMAL gives a good balance between durability
 and performance.
*/

db.pragma(
    "synchronous = NORMAL"
);


// ============================================================
// DATABASE INITIALIZATION
// ============================================================

function initializeDatabase() {

    /*
    ----------------------------------------------------------
    SALES TABLE
    ----------------------------------------------------------
    */

    db.exec(`
        CREATE TABLE IF NOT EXISTS sales (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            amount REAL NOT NULL,

            description TEXT NOT NULL DEFAULT 'Restaurant Sale',

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

        );
    `);


    /*
    ----------------------------------------------------------
    EXPENSES TABLE
    ----------------------------------------------------------
    */

    db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            amount REAL NOT NULL,

            description TEXT NOT NULL,

            supplier TEXT DEFAULT '',

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

        );
    `);


    /*
    ----------------------------------------------------------
    NOTES TABLE
    ----------------------------------------------------------
    */

    db.exec(`
        CREATE TABLE IF NOT EXISTS notes (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            text TEXT NOT NULL,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

        );
    `);


    /*
    ----------------------------------------------------------
    SETTINGS TABLE
    ----------------------------------------------------------

    This allows restaurant settings to survive server
    restarts.

    Example:

        restaurant_name
        currency
    */

    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (

            key TEXT PRIMARY KEY,

            value TEXT NOT NULL

        );
    `);


    /*
    ----------------------------------------------------------
    INDEXES
    ----------------------------------------------------------

    These make date-based searches faster as the database
    grows.
    */

    db.exec(`
        CREATE INDEX IF NOT EXISTS
        idx_sales_created_at
        ON sales(created_at);
    `);


    db.exec(`
        CREATE INDEX IF NOT EXISTS
        idx_expenses_created_at
        ON expenses(created_at);
    `);


    db.exec(`
        CREATE INDEX IF NOT EXISTS
        idx_notes_created_at
        ON notes(created_at);
    `);


    /*
    ----------------------------------------------------------
    DEFAULT SETTINGS
    ----------------------------------------------------------
    */

    const insertSetting =
        db.prepare(`
            INSERT OR IGNORE INTO settings
            (key, value)
            VALUES (?, ?)
        `);


    insertSetting.run(
        "restaurant_name",
        "Arzoo Restaurant"
    );


    insertSetting.run(
        "currency",
        "PKR"
    );

}


// Run initialization.

initializeDatabase();


// ============================================================
// DATE HELPERS
// ============================================================

/*
 SQLite CURRENT_TIMESTAMP uses UTC.

 For dashboard calculations we use SQLite's localtime
 conversion where required.

 This helper creates an ISO timestamp for inserted records.
*/

function currentTimestamp() {

    return new Date()
        .toISOString();

}


// ============================================================
// NUMBER HELPERS
// ============================================================

function roundMoney(value) {

    return Math.round(
        Number(value) * 100
    ) / 100;

}


// ============================================================
// SALES
// ============================================================

/*
--------------------------------------------------------------
 GET SALES
--------------------------------------------------------------
*/

function getSales(limit = 100) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            500
        );


    return db.prepare(`
        SELECT

            id,

            amount,

            description,

            created_at

        FROM sales

        ORDER BY
            datetime(created_at) DESC

        LIMIT ?
    `)
    .all(
        safeLimit
    );

}


/*
--------------------------------------------------------------
 CREATE SALE
--------------------------------------------------------------
*/

function createSale({
    amount,
    description
}) {

    const safeAmount =
        roundMoney(amount);


    const safeDescription =
        String(
            description ||
            "Restaurant Sale"
        )
        .trim()
        .slice(0, 300);


    const statement =
        db.prepare(`
            INSERT INTO sales
            (
                amount,
                description,
                created_at
            )
            VALUES
            (
                ?,
                ?,
                ?
            )
        `);


    const result =
        statement.run(
            safeAmount,
            safeDescription,
            currentTimestamp()
        );


    return db.prepare(`
        SELECT
            id,
            amount,
            description,
            created_at
        FROM sales
        WHERE id = ?
    `)
    .get(
        result.lastInsertRowid
    );

}


/*
--------------------------------------------------------------
 DELETE SALE
--------------------------------------------------------------
*/

function deleteSale(id) {

    const result =
        db.prepare(`
            DELETE FROM sales
            WHERE id = ?
        `)
        .run(id);


    return result.changes > 0;

}


// ============================================================
// EXPENSES
// ============================================================

/*
--------------------------------------------------------------
 GET EXPENSES
--------------------------------------------------------------
*/

function getExpenses(limit = 100) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            500
        );


    return db.prepare(`
        SELECT

            id,

            amount,

            description,

            supplier,

            created_at

        FROM expenses

        ORDER BY
            datetime(created_at) DESC

        LIMIT ?
    `)
    .all(
        safeLimit
    );

}


/*
--------------------------------------------------------------
 CREATE EXPENSE
--------------------------------------------------------------
*/

function createExpense({
    amount,
    description,
    supplier = ""
}) {

    const safeAmount =
        roundMoney(amount);


    const safeDescription =
        String(
            description
        )
        .trim()
        .slice(0, 300);


    const safeSupplier =
        String(
            supplier || ""
        )
        .trim()
        .slice(0, 200);


    const statement =
        db.prepare(`
            INSERT INTO expenses
            (
                amount,
                description,
                supplier,
                created_at
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?
            )
        `);


    const result =
        statement.run(
            safeAmount,
            safeDescription,
            safeSupplier,
            currentTimestamp()
        );


    return db.prepare(`
        SELECT

            id,

            amount,

            description,

            supplier,

            created_at

        FROM expenses

        WHERE id = ?
    `)
    .get(
        result.lastInsertRowid
    );

}


/*
--------------------------------------------------------------
 DELETE EXPENSE
--------------------------------------------------------------
*/

function deleteExpense(id) {

    const result =
        db.prepare(`
            DELETE FROM expenses
            WHERE id = ?
        `)
        .run(id);


    return result.changes > 0;

}


// ============================================================
// NOTES
// ============================================================

/*
--------------------------------------------------------------
 GET NOTES
--------------------------------------------------------------
*/

function getNotes(limit = 100) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            500
        );


    return db.prepare(`
        SELECT

            id,

            text,

            created_at,

            updated_at

        FROM notes

        ORDER BY
            datetime(updated_at) DESC

        LIMIT ?
    `)
    .all(
        safeLimit
    );

}


/*
--------------------------------------------------------------
 CREATE NOTE
--------------------------------------------------------------
*/

function createNote({
    text
}) {

    const safeText =
        String(
            text
        )
        .trim()
        .slice(0, 5000);


    const timestamp =
        currentTimestamp();


    const result =
        db.prepare(`
            INSERT INTO notes
            (
                text,
                created_at,
                updated_at
            )
            VALUES
            (
                ?,
                ?,
                ?
            )
        `)
        .run(
            safeText,
            timestamp,
            timestamp
        );


    return db.prepare(`
        SELECT

            id,

            text,

            created_at,

            updated_at

        FROM notes

        WHERE id = ?
    `)
    .get(
        result.lastInsertRowid
    );

}


/*
--------------------------------------------------------------
 UPDATE NOTE
--------------------------------------------------------------
*/

function updateNote(
    id,
    text
) {

    const safeText =
        String(
            text
        )
        .trim()
        .slice(0, 5000);


    const result =
        db.prepare(`
            UPDATE notes

            SET

                text = ?,

                updated_at = ?

            WHERE id = ?
        `)
        .run(
            safeText,
            currentTimestamp(),
            id
        );


    return result.changes > 0;

}


/*
--------------------------------------------------------------
 DELETE NOTE
--------------------------------------------------------------
*/

function deleteNote(id) {

    const result =
        db.prepare(`
            DELETE FROM notes
            WHERE id = ?
        `)
        .run(id);


    return result.changes > 0;

}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function getDashboardStats() {

    /*
    ----------------------------------------------------------
    TODAY'S SALES
    ----------------------------------------------------------
    */

    const todaySales =
        db.prepare(`
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total
            FROM sales
            WHERE date(
                datetime(
                    created_at,
                    'localtime'
                )
            )
            =
            date('now', 'localtime')
        `)
        .get();


    /*
    ----------------------------------------------------------
    TODAY'S EXPENSES
    ----------------------------------------------------------
    */

    const todayExpenses =
        db.prepare(`
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total
            FROM expenses
            WHERE date(
                datetime(
                    created_at,
                    'localtime'
                )
            )
            =
            date('now', 'localtime')
        `)
        .get();


    /*
    ----------------------------------------------------------
    ALL-TIME SALES
    ----------------------------------------------------------
    */

    const totalSales =
        db.prepare(`
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total
            FROM sales
        `)
        .get();


    /*
    ----------------------------------------------------------
    ALL-TIME EXPENSES
    ----------------------------------------------------------
    */

    const totalExpenses =
        db.prepare(`
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total
            FROM expenses
        `)
        .get();


    /*
    ----------------------------------------------------------
    TRANSACTION COUNT
    ----------------------------------------------------------
    */

    const transactionCount =
        db.prepare(`
            SELECT

                (
                    SELECT COUNT(*)
                    FROM sales
                )

                +

                (
                    SELECT COUNT(*)
                    FROM expenses
                )

                AS total
        `)
        .get();


    /*
    ----------------------------------------------------------
    TODAY'S TRANSACTION COUNT
    ----------------------------------------------------------
    */

    const todayTransactions =
        db.prepare(`
            SELECT

                (
                    SELECT COUNT(*)
                    FROM sales
                    WHERE date(
                        datetime(
                            created_at,
                            'localtime'
                        )
                    )
                    =
                    date(
                        'now',
                        'localtime'
                    )
                )

                +

                (
                    SELECT COUNT(*)
                    FROM expenses
                    WHERE date(
                        datetime(
                            created_at,
                            'localtime'
                        )
                    )
                    =
                    date(
                        'now',
                        'localtime'
                    )
                )

                AS total
        `)
        .get();


    const sales =
        roundMoney(
            todaySales.total
        );


    const expenses =
        roundMoney(
            todayExpenses.total
        );


    const allSales =
        roundMoney(
            totalSales.total
        );


    const allExpenses =
        roundMoney(
            totalExpenses.total
        );


    return {

        todaySales:
            sales,

        todayExpenses:
            expenses,

        todayProfit:
            roundMoney(
                sales - expenses
            ),

        totalSales:
            allSales,

        totalExpenses:
            allExpenses,

        totalProfit:
            roundMoney(
                allSales - allExpenses
            ),

        totalTransactions:
            transactionCount.total,

        todayTransactions:
            todayTransactions.total

    };

}


// ============================================================
// RECENT ACTIVITY
// ============================================================

function getRecentActivity(
    limit = 10
) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            100
        );


    /*
    Combine sales and expenses into one activity feed.

    type:
        sale
        expense
    */

    return db.prepare(`
        SELECT

            id,

            amount,

            description,

            created_at,

            'sale' AS type

        FROM sales

        UNION ALL

        SELECT

            id,

            amount,

            description,

            created_at,

            'expense' AS type

        FROM expenses

        ORDER BY
            datetime(created_at) DESC

        LIMIT ?
    `)
    .all(
        safeLimit
    );

}


// ============================================================
// STATISTICS
// ============================================================

function getStatistics(
    period = "month"
) {

    let dateCondition;


    switch (period) {

        case "day":

            dateCondition = `
                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                )
                =
                date(
                    'now',
                    'localtime'
                )
            `;

            break;


        case "week":

            dateCondition = `
                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                )
                >=
                date(
                    'now',
                    'localtime',
                    '-6 days'
                )
            `;

            break;


        case "year":

            dateCondition = `
                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                )
                >=
                date(
                    'now',
                    'localtime',
                    'start of year'
                )
            `;

            break;


        case "all":

            dateCondition = `
                1 = 1
            `;

            break;


        case "month":

        default:

            dateCondition = `
                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                )
                >=
                date(
                    'now',
                    'localtime',
                    'start of month'
                )
            `;

            break;

    }


    /*
    ----------------------------------------------------------
    SALES TOTAL
    ----------------------------------------------------------
    */

    const sales =
        db.prepare(`
            SELECT

                COALESCE(
                    SUM(amount),
                    0
                ) AS total,

                COUNT(*) AS count

            FROM sales

            WHERE ${dateCondition}
        `)
        .get();


    /*
    ----------------------------------------------------------
    EXPENSE TOTAL
    ----------------------------------------------------------
    */

    const expenses =
        db.prepare(`
            SELECT

                COALESCE(
                    SUM(amount),
                    0
                ) AS total,

                COUNT(*) AS count

            FROM expenses

            WHERE ${dateCondition}
        `)
        .get();


    const totalSales =
        roundMoney(
            sales.total
        );


    const totalExpenses =
        roundMoney(
            expenses.total
        );


    const profit =
        roundMoney(
            totalSales -
            totalExpenses
        );


    return {

        period,

        sales:
            totalSales,

        expenses:
            totalExpenses,

        profit,

        salesCount:
            sales.count,

        expenseCount:
            expenses.count,

        transactions:
            sales.count +
            expenses.count

    };

}


// ============================================================
// CHART / DAILY BREAKDOWN
// ============================================================

/*
 This function will be useful when we add charts to the
 frontend.

 It returns the last N days with:

    sales
    expenses
    profit
*/

function getDailyBreakdown(
    days = 7
) {

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 7,
                1
            ),
            90
        );


    const sales =
        db.prepare(`
            SELECT

                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                ) AS day,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total

            FROM sales

            WHERE date(
                datetime(
                    created_at,
                    'localtime'
                )
            )
            >=
            date(
                'now',
                'localtime',
                '-' || (? - 1) || ' days'
            )

            GROUP BY day

            ORDER BY day ASC
        `)
        .all(
            safeDays
        );


    const expenses =
        db.prepare(`
            SELECT

                date(
                    datetime(
                        created_at,
                        'localtime'
                    )
                ) AS day,

                COALESCE(
                    SUM(amount),
                    0
                ) AS total

            FROM expenses

            WHERE date(
                datetime(
                    created_at,
                    'localtime'
                )
            )
            >=
            date(
                'now',
                'localtime',
                '-' || (? - 1) || ' days'
            )

            GROUP BY day

            ORDER BY day ASC
        `)
        .all(
            safeDays
        );


    const salesMap =
        new Map(
            sales.map(
                item => [
                    item.day,
                    Number(item.total)
                ]
            )
        );


    const expenseMap =
        new Map(
            expenses.map(
                item => [
                    item.day,
                    Number(item.total)
                ]
            )
        );


    const result = [];


    for (
        let index = safeDays - 1;
        index >= 0;
        index--
    ) {

        const date =
            new Date();


        date.setDate(
            date.getDate() - index
        );


        const day =
            date
                .toISOString()
                .slice(0, 10);


        const sale =
            roundMoney(
                salesMap.get(day) || 0
            );


        const expense =
            roundMoney(
                expenseMap.get(day) || 0
            );


        result.push({

            day,

            sales:
                sale,

            expenses:
                expense,

            profit:
                roundMoney(
                    sale - expense
                )

        });

    }


    return result;

}


// ============================================================
// SETTINGS
// ============================================================

function getSetting(
    key,
    fallback = null
) {

    const result =
        db.prepare(`
            SELECT value
            FROM settings
            WHERE key = ?
        `)
        .get(
            key
        );


    if (!result) {

        return fallback;

    }


    return result.value;

}


function setSetting(
    key,
    value
) {

    const safeKey =
        String(
            key
        )
        .trim()
        .slice(0, 100);


    const safeValue =
        String(
            value
        )
        .trim()
        .slice(0, 1000);


    db.prepare(`
        INSERT INTO settings
        (
            key,
            value
        )

        VALUES
        (
            ?,
            ?
        )

        ON CONFLICT(key)
        DO UPDATE SET
            value = excluded.value
    `)
    .run(
        safeKey,
        safeValue
    );


    return true;

}


function getAllSettings() {

    const rows =
        db.prepare(`
            SELECT
                key,
                value
            FROM settings
            ORDER BY key ASC
        `)
        .all();


    const settings = {};


    for (
        const row of rows
    ) {

        settings[
            row.key
        ] =
            row.value;

    }


    return settings;

}


// ============================================================
// EXPORT ALL DATA
// ============================================================

function exportAllData() {

    const sales =
        db.prepare(`
            SELECT
                id,
                amount,
                description,
                created_at
            FROM sales
            ORDER BY id ASC
        `)
        .all();


    const expenses =
        db.prepare(`
            SELECT
                id,
                amount,
                description,
                supplier,
                created_at
            FROM expenses
            ORDER BY id ASC
        `)
        .all();


    const notes =
        db.prepare(`
            SELECT
                id,
                text,
                created_at,
                updated_at
            FROM notes
            ORDER BY id ASC
        `)
        .all();


    const settings =
        getAllSettings();


    return {

        application:
            "Arzoo Restaurant Management",

        version:
            "1.0.0",

        exportedAt:
            new Date().toISOString(),

        data: {

            sales,

            expenses,

            notes,

            settings

        }

    };

}


// ============================================================
// DELETE EVERYTHING
// ============================================================

function deleteAllData() {

    /*
    Use a transaction so either everything is deleted or
    the database rolls back if something goes wrong.
    */

    const deleteTransaction =
        db.transaction(
            () => {

                db.exec(`
                    DELETE FROM sales;
                `);


                db.exec(`
                    DELETE FROM expenses;
                `);


                db.exec(`
                    DELETE FROM notes;
                `);

            }
        );


    deleteTransaction();

    return true;

}


// ============================================================
// DATABASE BACKUP
// ============================================================

async function backupDatabase(
    destinationPath
) {

    if (
        !destinationPath
    ) {

        throw new Error(
            "Backup destination is required."
        );

    }


    await db.backup(
        destinationPath
    );


    return destinationPath;

}


// ============================================================
// DATABASE SIZE
// ============================================================

function getDatabaseInfo() {

    let databaseSize =
        0;


    try {

        if (
            fs.existsSync(
                databasePath
            )
        ) {

            databaseSize =
                fs.statSync(
                    databasePath
                ).size;

        }

    } catch (error) {

        console.error(
            "Unable to read database size:",
            error
        );

    }


    return {

        path:
            databasePath,

        sizeBytes:
            databaseSize,

        sizeMB:
            Math.round(
                (
                    databaseSize /
                    1024 /
                    1024
                ) * 100
            ) / 100

    };

}


// ============================================================
// DATABASE CLOSE
// ============================================================

function close() {

    try {

        if (
            db &&
            db.open
        ) {

            db.close();

        }

    } catch (error) {

        console.error(
            "Database close error:",
            error
        );

    }

}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    // Database
    db,

    close,

    getDatabaseInfo,

    backupDatabase,


    // Sales
    getSales,

    createSale,

    deleteSale,


    // Expenses
    getExpenses,

    createExpense,

    deleteExpense,


    // Notes
    getNotes,

    createNote,

    updateNote,

    deleteNote,


    // Dashboard
    getDashboardStats,

    getRecentActivity,


    // Statistics
    getStatistics,

    getDailyBreakdown,


    // Settings
    getSetting,

    setSetting,

    getAllSettings,


    // Export / reset
    exportAllData,

    deleteAllData

};