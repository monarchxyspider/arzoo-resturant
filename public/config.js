"use strict";

/*
============================================================
ARZOO RESTAURANT
CONFIGURATION
============================================================

Yahan se website ki basic settings change karo.

IMPORTANT:
- Yahan password mat rakhna.
- Image URLs direct image links honi chahiye.
- config.js frontend me load hoti hai, isliye secret
  information yahan kabhi mat rakhna.
============================================================
*/

const CONFIG = {

    // ======================================================
    // RESTAURANT
    // ======================================================

    restaurantName: "Arzoo Restaurant",

    currency: "PKR",


    // ======================================================
    // THEME
    // ======================================================

    theme: {

        primary: "#C62828",

        primaryDark: "#8E0000",

        background: "#F8F8F8",

        card: "#FFFFFF",

        text: "#222222",

        muted: "#777777",

        danger: "#D32F2F",

        success: "#2E7D32"

    },


    // ======================================================
    // IMAGES / ICONS
    // ======================================================
    //
    // Yahan apni image URLs paste karo.
    //
    // Example:
    //
    // restaurant:
    // "https://example.com/logo.png"
    //
    // Agar kisi icon ki zarurat nahi ho to:
    //
    // ""
    //
    // ======================================================

    emojis: {

        // Restaurant logo
        restaurant:
            "",


        // Sidebar
        dashboard:
            "",

        sales:
            "",

        expense:
            "",

        notes:
            "",

        statistics:
            "",

        settings:
            "",


        // Statistics
        profit:
            "",

        transactions:
            ""

    }

};