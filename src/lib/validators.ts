import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  thumbnail: z.string().optional(),
  siteName: z.string().optional(),
  favicon: z.string().optional(),
});

export const savedLinkSchema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type TodoInput = z.infer<typeof todoSchema>;
export type SavedLinkInput = z.infer<typeof savedLinkSchema>;

export const boardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type BoardInput = z.infer<typeof boardSchema>;

export const columnSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().max(7).optional(),
  icon: z.string().max(50).optional(),
});

export type ColumnInput = z.infer<typeof columnSchema>;

export const addCardSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    columnId: z.string().min(1),
    todoId: z.string().optional(),
    savedLinkId: z.string().optional(),
  }),
  z.object({
    mode: z.literal("new-todo"),
    columnId: z.string().min(1),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    dueDate: z.string().optional(),
    reminderAt: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
    thumbnail: z.string().optional(),
    siteName: z.string().optional(),
    favicon: z.string().optional(),
  }),
  z.object({
    mode: z.literal("new-link"),
    columnId: z.string().min(1),
    url: z.string().url("Invalid URL"),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
]);

export type AddCardInput = z.infer<typeof addCardSchema>;

export const reorderSchema = z.object({
  columns: z
    .array(z.object({ id: z.string(), position: z.number().int().min(0) }))
    .optional(),
  cards: z
    .array(
      z.object({
        id: z.string(),
        columnId: z.string(),
        position: z.number().int().min(0),
      })
    )
    .optional(),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
