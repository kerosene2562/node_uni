import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";

export interface User {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        const result = ret as Record<string, unknown>;
        delete result.passwordHash;
        return result;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const result = ret as Record<string, unknown>;
        delete result.passwordHash;
        return result;
      },
    },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

export const UserModel = model<User>("User", userSchema);