// backend/src/models/noteFolder.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoteFolderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ❌ pas d'index inline
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true }, // ❌
    folder: { type: Schema.Types.ObjectId, ref: "Folder", default: null }, // ❌
  },
  { timestamps: true }
);

// ✅ Index centralisés
NoteFolderSchema.index(
  { user: 1, note: 1 },
  { unique: true, name: "nf_user_note_unique" }
);
NoteFolderSchema.index({ folder: 1 }, { name: "nf_folder" });

module.exports =
  mongoose.models.NoteFolder ||
  mongoose.model("NoteFolder", NoteFolderSchema, "note_folders");
