// C:\Users\ADMIN\Desktop\fullmargin-site\backend\src\models\kanban.task.model.js
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KanbanProject",
      index: true,
      required: true,
    },

    titre: { type: String, trim: true, required: true },
    etiquette: { type: String, trim: true, default: "" },
    echeance: { type: Date, default: null },
    priorite: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    statut: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    terminee: { type: Boolean, default: false },
    imageUrl: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },

    /** ✅ icône lucide (nom de composant) */
    icon: { type: String, trim: true, default: "" },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KanbanTask", TaskSchema, "kanban_tasks");
