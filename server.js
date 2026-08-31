"use strict";

/*
===========================================================
 ARZOO RESTAURANT — MANAGEMENT SERVER
===========================================================

 Main backend for the private Arzoo Restaurant Management
 Dashboard.

 Responsibilities:
 - Load environment variables
 - Start Express server
 - Serve frontend files
 - Handle secure login
 - Maintain authenticated sessions
 - Provide REST API
 - Manage sales
 - Manage expenses / purchases
 - Manage notes
 - Provide dashboard statistics
 - Provide recent activity
 - Validate incoming data
 - Prevent unauthorized API access
 - Handle errors gracefully

 Project structure expected:

 arzoo-restaurant/
 ├── server.js
 ├── package.json
 ├── .env
 ├── .gitignore
 ├── config.js
 ├── database/
 │   └── database.js
 └── public/
     ├── index.html
     ├── style.css
     └── script.js

===========================================================
*/

const path = require("path");
const crypto = require("crypto");

const express = require("express");
const session = require("cookie-session");
const dotenv = require("dotenv");


// =========================================================
// ENVIRONMENT
// =========================================================

dotenv.config();


/*
-----------------------------------------------------------
 Environment variables
-----------------------------------------------------------

 Example .env:

 PORT=3000
 ARZOO_ADMIN_PASSWORD=your_password
 SESSION_SECRET=your_long_random_secret
 NODE_ENV=production

 IMPORTANT:
 Never upload .env to GitHub.
-----------------------------------------------------------
*/

const PORT =
    Number(process.env.PORT) || 3000;

const ADMIN_PASSWORD =
    process.env.ARZOO_ADMIN_PASSWORD;

const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    crypto.randomBytes(32).toString("hex");

const NODE_ENV =
    process.env.NODE_ENV || "development";


/*
-----------------------------------------------------------
 Password validation
-----------------------------------------------------------
*/

if (!ADMIN_PASSWORD) {

    console.error(
        "\n=================================================="
    );

    console.error(
        "ERROR: ARZOO_ADMIN_PASSWORD is missing."
    );

    console.error(
        "Create a .env file and add:"
    );

    console.error(
        "ARZOO_ADMIN_PASSWORD=your_password"
    );

    console.error(
        "==================================================\n"
    );

    process.exit(1);
}


// =========================================================
// DATABASE
// =========================================================

/*
 The database module will be created separately.

 It is expected to export functions for:

 - getDashboardStats
 - getSales
 - createSale
 - deleteSale
 - getExpenses
 - createExpense
 - deleteExpense
 - getNotes
 - createNote
 - updateNote
 - deleteNote
 - getRecentActivity
 - getStatistics
*/

let database;

try {

    database =
        require("./database/database");

} catch (error) {

    console.error(
        "\nDatabase module could not be loaded."
    );

    console.error(
        "Make sure this file exists:"
    );

    console.error(
        "./database/database.js"
    );

    console.error(error.message);

    process.exit(1);
}


// =========================================================
// EXPRESS
// =========================================================

const app =
    express();


/*
-----------------------------------------------------------
 Trust proxy
-----------------------------------------------------------

 Useful when deployed behind a reverse proxy.

 Only enable this in production.
-----------------------------------------------------------
*/

if (NODE_ENV === "production") {

    app.set(
        "trust proxy",
        1
    );

}


// =========================================================
// BASIC CONFIGURATION
// =========================================================

app.disable("x-powered-by");

app.use(
    express.json({
        limit: "100kb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "100kb"
    })
);


// =========================================================
// SECURITY HEADERS
// =========================================================

app.use(
    (req, res, next) => {

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        res.setHeader(
            "X-Frame-Options",
            "DENY"
        );

        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );

        res.setHeader(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()"
        );

        next();

    }
);


// =========================================================
// SESSION
// =========================================================

/*
 cookie-session keeps a signed session cookie.

 We only store a small boolean in the session.

 The password itself is NEVER stored in the session.
*/

app.use(
    session({

        name: "arzoo_session",

        keys: [
            SESSION_SECRET
        ],

        httpOnly: true,

        secure:
            NODE_ENV === "production",

        sameSite: "lax",

        maxAge:
            1000 *
            60 *
            60 *
            12

    })
);


// =========================================================
// REQUEST HELPERS
// =========================================================

function isAuthenticated(req) {

    return Boolean(
        req.session &&
        req.session.authenticated === true
    );

}


function requireAuth(req, res, next) {

    if (!isAuthenticated(req)) {

        return res.status(401).json({

            success: false,

            error: "Authentication required."

        });

    }

    next();

}


// =========================================================
// PASSWORD COMPARISON
// =========================================================

/*
-----------------------------------------------------------
 Constant-time password comparison.

 This avoids using a simple:

 password === ADMIN_PASSWORD

 comparison.

 The supplied password is converted into a Buffer and
 compared using crypto.timingSafeEqual.
-----------------------------------------------------------
*/

function passwordsMatch(input) {

    if (
        typeof input !== "string" ||
        typeof ADMIN_PASSWORD !== "string"
    ) {

        return false;

    }


    const inputBuffer =
        Buffer.from(input);

    const storedBuffer =
        Buffer.from(ADMIN_PASSWORD);


    if (
        inputBuffer.length !==
        storedBuffer.length
    ) {

        return false;

    }


    return crypto.timingSafeEqual(
        inputBuffer,
        storedBuffer
    );

}


// =========================================================
// INPUT HELPERS
// =========================================================

function cleanString(
    value,
    maxLength = 500
) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .trim()
        .slice(0, maxLength);

}


function parseAmount(value) {

    const amount =
        Number(value);


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return null;

    }


    /*
     Keep financial values to two decimal places.
    */

    return Math.round(
        amount * 100
    ) / 100;

}


function validId(value) {

    const id =
        Number(value);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return null;

    }


    return id;

}


// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status: "online",

            service:
                "Arzoo Restaurant Management",

            timestamp:
                new Date().toISOString()

        });

    }
);


// =========================================================
// AUTHENTICATION
// =========================================================


/*
-----------------------------------------------------------
 POST /api/auth/login
-----------------------------------------------------------
*/

app.post(
    "/api/auth/login",
    (req, res) => {

        try {

            const password =
                typeof req.body.password === "string"
                    ? req.body.password
                    : "";


            if (!password) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Password is required."

                });

            }


            if (!passwordsMatch(password)) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Incorrect password."

                });

            }


            req.session.authenticated =
                true;

            req.session.loginTime =
                Date.now();


            return res.json({

                success: true,

                message:
                    "Login successful."

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to process login."

            });

        }

    }
);


/*
-----------------------------------------------------------
 GET /api/auth/status
-----------------------------------------------------------
*/

app.get(
    "/api/auth/status",
    (req, res) => {

        res.json({

            success: true,

            authenticated:
                isAuthenticated(req)

        });

    }
);


/*
-----------------------------------------------------------
 POST /api/auth/logout
-----------------------------------------------------------
*/

app.post(
    "/api/auth/logout",
    (req, res) => {

        try {

            req.session = null;

            return res.json({

                success: true,

                message:
                    "Dashboard locked."

            });

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to logout."

            });

        }

    }
);


// =========================================================
// DASHBOARD
// =========================================================


/*
-----------------------------------------------------------
 GET /api/dashboard
-----------------------------------------------------------

 Returns the information needed for the main dashboard.
-----------------------------------------------------------
*/

app.get(
    "/api/dashboard",
    requireAuth,
    (req, res) => {

        try {

            const stats =
                database.getDashboardStats();


            const recentActivity =
                database.getRecentActivity(8);


            return res.json({

                success: true,

                stats,

                recentActivity

            });

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to load dashboard."

            });

        }

    }
);


// =========================================================
// SALES
// =========================================================


/*
-----------------------------------------------------------
 GET SALES
-----------------------------------------------------------
*/

app.get(
    "/api/sales",
    requireAuth,
    (req, res) => {

        try {

            const limit =
                Math.min(
                    Number(req.query.limit) || 100,
                    500
                );


            const sales =
                database.getSales(limit);


            return res.json({

                success: true,

                sales

            });

        } catch (error) {

            console.error(
                "Get sales error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to load sales."

            });

        }

    }
);


/*
-----------------------------------------------------------
 CREATE SALE
-----------------------------------------------------------
*/

app.post(
    "/api/sales",
    requireAuth,
    (req, res) => {

        try {

            const amount =
                parseAmount(
                    req.body.amount
                );


            const description =
                cleanString(
                    req.body.description,
                    300
                );


            if (amount === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please enter a valid sale amount."

                });

            }


            const sale =
                database.createSale({

                    amount,

                    description:
                        description ||
                        "Restaurant Sale"

                });


            return res.status(201).json({

                success: true,

                message:
                    "Sale added successfully.",

                sale

            });

        } catch (error) {

            console.error(
                "Create sale error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to save sale."

            });

        }

    }
);


/*
-----------------------------------------------------------
 DELETE SALE
-----------------------------------------------------------
*/

app.delete(
    "/api/sales/:id",
    requireAuth,
    (req, res) => {

        try {

            const id =
                validId(
                    req.params.id
                );


            if (id === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid sale ID."

                });

            }


            const deleted =
                database.deleteSale(id);


            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Sale not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Sale deleted."

            });

        } catch (error) {

            console.error(
                "Delete sale error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to delete sale."

            });

        }

    }
);


// =========================================================
// EXPENSES / PURCHASES
// =========================================================


/*
-----------------------------------------------------------
 GET EXPENSES
-----------------------------------------------------------
*/

app.get(
    "/api/expenses",
    requireAuth,
    (req, res) => {

        try {

            const limit =
                Math.min(
                    Number(req.query.limit) || 100,
                    500
                );


            const expenses =
                database.getExpenses(limit);


            return res.json({

                success: true,

                expenses

            });

        } catch (error) {

            console.error(
                "Get expenses error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to load expenses."

            });

        }

    }
);


/*
-----------------------------------------------------------
 CREATE EXPENSE
-----------------------------------------------------------
*/

app.post(
    "/api/expenses",
    requireAuth,
    (req, res) => {

        try {

            const amount =
                parseAmount(
                    req.body.amount
                );


            const description =
                cleanString(
                    req.body.description,
                    300
                );


            const supplier =
                cleanString(
                    req.body.supplier,
                    200
                );


            if (amount === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please enter a valid expense amount."

                });

            }


            if (!description) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Expense description is required."

                });

            }


            const expense =
                database.createExpense({

                    amount,

                    description,

                    supplier

                });


            return res.status(201).json({

                success: true,

                message:
                    "Expense added successfully.",

                expense

            });

        } catch (error) {

            console.error(
                "Create expense error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to save expense."

            });

        }

    }
);


/*
-----------------------------------------------------------
 DELETE EXPENSE
-----------------------------------------------------------
*/

app.delete(
    "/api/expenses/:id",
    requireAuth,
    (req, res) => {

        try {

            const id =
                validId(
                    req.params.id
                );


            if (id === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid expense ID."

                });

            }


            const deleted =
                database.deleteExpense(id);


            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Expense not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Expense deleted."

            });

        } catch (error) {

            console.error(
                "Delete expense error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to delete expense."

            });

        }

    }
);


// =========================================================
// NOTES
// =========================================================


/*
-----------------------------------------------------------
 GET NOTES
-----------------------------------------------------------
*/

app.get(
    "/api/notes",
    requireAuth,
    (req, res) => {

        try {

            const limit =
                Math.min(
                    Number(req.query.limit) || 100,
                    500
                );


            const notes =
                database.getNotes(limit);


            return res.json({

                success: true,

                notes

            });

        } catch (error) {

            console.error(
                "Get notes error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to load notes."

            });

        }

    }
);


/*
-----------------------------------------------------------
 CREATE NOTE
-----------------------------------------------------------
*/

app.post(
    "/api/notes",
    requireAuth,
    (req, res) => {

        try {

            const text =
                cleanString(
                    req.body.text,
                    5000
                );


            if (!text) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Note cannot be empty."

                });

            }


            const note =
                database.createNote({
                    text
                });


            return res.status(201).json({

                success: true,

                message:
                    "Note saved successfully.",

                note

            });

        } catch (error) {

            console.error(
                "Create note error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to save note."

            });

        }

    }
);


/*
-----------------------------------------------------------
 UPDATE NOTE
-----------------------------------------------------------
*/

app.put(
    "/api/notes/:id",
    requireAuth,
    (req, res) => {

        try {

            const id =
                validId(
                    req.params.id
                );


            const text =
                cleanString(
                    req.body.text,
                    5000
                );


            if (id === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid note ID."

                });

            }


            if (!text) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Note cannot be empty."

                });

            }


            const updated =
                database.updateNote(
                    id,
                    text
                );


            if (!updated) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Note not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Note updated."

            });

        } catch (error) {

            console.error(
                "Update note error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to update note."

            });

        }

    }
);


/*
-----------------------------------------------------------
 DELETE NOTE
-----------------------------------------------------------
*/

app.delete(
    "/api/notes/:id",
    requireAuth,
    (req, res) => {

        try {

            const id =
                validId(
                    req.params.id
                );


            if (id === null) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid note ID."

                });

            }


            const deleted =
                database.deleteNote(id);


            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Note not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Note deleted."

            });

        } catch (error) {

            console.error(
                "Delete note error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to delete note."

            });

        }

    }
);


// =========================================================
// STATISTICS
// =========================================================


/*
-----------------------------------------------------------
 GET /api/statistics
-----------------------------------------------------------

 Optional query:

 ?period=day
 ?period=week
 ?period=month
 ?period=year
 ?period=all

-----------------------------------------------------------
*/

app.get(
    "/api/statistics",
    requireAuth,
    (req, res) => {

        try {

            const allowedPeriods = [
                "day",
                "week",
                "month",
                "year",
                "all"
            ];


            const period =
                allowedPeriods.includes(
                    req.query.period
                )
                    ? req.query.period
                    : "month";


            const statistics =
                database.getStatistics(
                    period
                );


            return res.json({

                success: true,

                period,

                statistics

            });

        } catch (error) {

            console.error(
                "Statistics error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to load statistics."

            });

        }

    }
);


// =========================================================
// DATA EXPORT
// =========================================================


/*
-----------------------------------------------------------
 GET /api/export
-----------------------------------------------------------

 Exports all management data as JSON.

 This is useful for backups.
-----------------------------------------------------------
*/

app.get(
    "/api/export",
    requireAuth,
    (req, res) => {

        try {

            const data =
                database.exportAllData();


            const filename =
                `arzoo-restaurant-backup-${new Date()
                    .toISOString()
                    .slice(0, 10)}.json`;


            res.setHeader(
                "Content-Type",
                "application/json"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );


            return res.send(
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

        } catch (error) {

            console.error(
                "Export error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to export data."

            });

        }

    }
);


// =========================================================
// DATA RESET
// =========================================================


/*
-----------------------------------------------------------
 DELETE /api/data/all

 Extremely destructive operation.

 The frontend should ask for confirmation before calling it.
-----------------------------------------------------------
*/

app.delete(
    "/api/data/all",
    requireAuth,
    (req, res) => {

        try {

            database.deleteAllData();


            return res.json({

                success: true,

                message:
                    "All restaurant data has been deleted."

            });

        } catch (error) {

            console.error(
                "Delete all data error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Unable to delete all data."

            });

        }

    }
);


// =========================================================
// FRONTEND
// =========================================================

const publicDirectory =
    path.join(
        __dirname,
        "public"
    );


/*
-----------------------------------------------------------
 Static files
-----------------------------------------------------------
*/

app.use(
    express.static(
        publicDirectory,
        {
            index: false,

            maxAge:
                NODE_ENV === "production"
                    ? "1d"
                    : 0
        }
    )
);


// =========================================================
// FRONTEND ROUTE
// =========================================================

/*
-----------------------------------------------------------
 GET /

 The login screen is served here.

 Authentication itself is still performed by
 /api/auth/login.
-----------------------------------------------------------
*/

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                publicDirectory,
                "index.html"
            )
        );

    }
);


// =========================================================
// UNKNOWN API ROUTE
// =========================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            error:
                "API endpoint not found."

        });

    }
);


// =========================================================
// GENERAL ERROR HANDLER
// =========================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(error);

        }


        return res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


// =========================================================
// SERVER START
// =========================================================

const server =
    app.listen(
        PORT,
        () => {

            console.log(
                "\n=================================================="
            );

            console.log(
                "   ARZOO RESTAURANT MANAGEMENT"
            );

            console.log(
                "=================================================="
            );

            console.log(
                `Server: http://localhost:${PORT}`
            );

            console.log(
                `Environment: ${NODE_ENV}`
            );

            console.log(
                "Database: SQLite"
            );

            console.log(
                "Authentication: Enabled"
            );

            console.log(
                "==================================================\n"
            );

        }
    );


// =========================================================
// GRACEFUL SHUTDOWN
// =========================================================

function shutdown(signal) {

    console.log(
        `\n${signal} received. Shutting down...`
    );


    server.close(
        () => {

            try {

                if (
                    database &&
                    typeof database.close ===
                    "function"
                ) {

                    database.close();

                }

            } catch (error) {

                console.error(
                    "Database close error:",
                    error
                );

            }


            console.log(
                "Arzoo Restaurant server stopped."
            );

            process.exit(0);

        }
    );


    /*
     Force shutdown if something refuses to close.
    */

    setTimeout(
        () => {

            console.error(
                "Forced shutdown."
            );

            process.exit(1);

        },
        10000
    );

}


process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);


// =========================================================
// UNHANDLED ERRORS
// =========================================================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "Unhandled Promise Rejection:",
            error
        );

    }
);


process.on(
    "uncaughtException",
    error => {

        console.error(
            "Uncaught Exception:",
            error
        );

        /*
         In production, an uncaught exception can leave the
         process in an unsafe state. Exit so the host can
         restart the service.
        */

        process.exit(1);

    }
);