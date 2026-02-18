// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\kanban.project.model.js
const mongoose = require("mongoose");

const DEFAULT_COLOR = "#7C3AED"; // violet fullmargin

const ProjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    name: { type: String, trim: true, default: "Sans nom" },
    description: { type: String, trim: true, default: "" },

    // ✅ nouvelle propriété
    color: {
      type: String,
      trim: true,
      default: DEFAULT_COLOR,
      // #RRGGBB (6 hexa)
      match: /^#[0-9A-Fa-f]{6}$/,
    },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "KanbanProject",
  ProjectSchema,
  "kanban_projects"
);
