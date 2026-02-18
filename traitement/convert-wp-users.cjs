// convert-wp-users.cjs
const fs = require("fs");
const { parse } = require("csv-parse");

// on lit le CSV tel quel
const input = fs.readFileSync("./wp_users.csv", "utf8");

// on parse
parse(
  input,
  {
    columns: true, // 1ère ligne = en-têtes
    skip_empty_lines: true,
    delimiter: ",", // ton fichier est bien à la virgule
    trim: true,
  },
  (err, rows) => {
    if (err) {
      console.error("❌ Erreur parsing CSV :", err);
      process.exit(1);
    }

    // rows est un tableau d'objets du genre :
    // { ID: '1', user_login: 'binaryyoungrich@gmail.com', user_pass: '...', ... }

    const docs = rows.map((row, i) => {
      const wpId = Number(row.ID) || null;
      const login = row.user_login || "";
      const nicename = row.user_nicename || "";
      const email = (row.user_email || "").toLowerCase();
      const pass = row.user_pass || "";
      const registered = row.user_registered || "";

      return {
        // ton schéma Mongoose
        fullName:
          nicename || login || (wpId ? `User ${wpId}` : `User ${i + 1}`),
        email,
        passwordHash: pass, // on garde le hash WordPress tel quel
        avatarUrl: "",
        coverUrl: "",
        roles: ["user"],
        isActive: true,
        localEnabled: true,
        twoFAEnabled: true,
        legacyWp: {
          wpId,
          wpLogin: login,
          wpRegisteredAt: registered,
          displayName: row.display_name || "",
        },
      };
    });

    fs.writeFileSync(
      "./wp_users_for_mongo.json",
      JSON.stringify(docs, null, 2),
      "utf8"
    );

    console.log("✅ OK, généré :", docs.length, "utilisateurs");
    console.log("✅ Fichier : wp_users_for_mongo.json");
  }
);
