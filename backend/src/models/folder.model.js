// backend/src/models/folder.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const FolderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ❌ pas d'index inline
    name: { type: String, required: true, trim: true, maxlength: 160 },
    parentId: { type: Schema.Types.ObjectId, ref: "Folder", default: null }, // ❌
    deletedAt: { type: Date, default: null }, // ❌
  },
  { timestamps: true }
);

// ✅ Index centralisés
FolderSchema.index(
  { user: 1, parentId: 1, name: 1 },
  { name: "fld_user_parent_name" }
);
FolderSchema.index(
  { user: 1, updatedAt: -1, _id: -1 },
  { name: "fld_user_updated_desc" }
);
FolderSchema.index({ deletedAt: 1 }, { name: "fld_deletedAt" });

module.exports =
  mongoose.models.Folder || mongoose.model("Folder", FolderSchema, "folders");
