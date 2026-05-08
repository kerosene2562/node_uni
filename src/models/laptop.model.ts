import { Schema, model } from "mongoose";

export interface Laptop {
  brand: string;
  name: string;
  description?: string;
  price: number;
  displaySize: number;
  cpu: string;
  gpu: string;
  releaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const laptopSchema = new Schema<Laptop>(
  {
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      minlength: [1, "Brand must contain at least 1 character"],
      maxlength: [100, "Brand must not exceed 100 characters"],
      enum: {
        values: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Samsung", "Huawei"],
        message: "Brand must be one of the allowed values",
      },
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name must contain at least 1 character"],
      maxlength: [200, "Name must not exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description must not exceed 500 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be greater than 0"],
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: "Price must be a positive number",
      },
    },
    displaySize: {
      type: Number,
      required: [true, "Display size is required"],
      min: [0.1, "Display size must be greater than 0"],
      validate: {
        validator: (value: number) => value >= 10 && value <= 25,
        message: "Display size must be between 10 and 25 inches",
      },
    },
    cpu: {
      type: String,
      required: [true, "CPU is required"],
      trim: true,
      minlength: [1, "CPU must contain at least 1 character"],
      maxlength: [100, "CPU must not exceed 100 characters"],
    },
    gpu: {
      type: String,
      required: [true, "GPU is required"],
      trim: true,
      minlength: [1, "GPU must contain at least 1 character"],
      maxlength: [100, "GPU must not exceed 100 characters"],
    },
    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
      validate: {
        validator: (value: Date) => value <= new Date(),
        message: "Release date cannot be in the future",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

laptopSchema.virtual("fullName").get(function () {
  return `${this.brand} ${this.name}`;
});

export const LaptopModel = model<Laptop>("Laptop", laptopSchema);