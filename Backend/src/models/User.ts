import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    org_id: {
      type: String,
    },
    primary_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    alternate_emails: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    full_name: {
      type: String,
      trim: true,
    },
    display_name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["engineer", "tech_lead", "pm", "hr", "other"],
      default: "other",
    },
    team: {
      type: String,
      trim: true,
    },
    source_accounts: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const User = mongoose.model("User", userSchema);

export default User;
