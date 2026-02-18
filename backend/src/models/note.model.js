// backend/src/models/note.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ❌ pas d'index inline
    title: { type: String, default: "Sans titre", trim: true, maxlength: 160 },
    doc: {
      type: Schema.Types.Mixed,
      default: [{ type: "paragraph", content: "" }],
    },
    pinned: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    deletedAt: { type: Date, default: null }, // ❌ pas d'index inline
  },
  { timestamps: true }
);

// ✅ Index centralisés
NoteSchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "note_user_updated_desc" }
);
NoteSchema.index(
  { user: 1, deletedAt: 1, updatedAt: 1 },
  { name: "note_user_deleted_updated" }
);

module.exports =
  mongoose.models.Note || mongoose.model("Note", NoteSchema, "notes");
