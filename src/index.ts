import express, { Router } from "express";
import type { Response, Request } from "express";
import type { CreateTodoDTO } from "./types/todo.js";
import pool from "./databases/database.js";

const router = Router();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", router);

// GET all todos (with optional filtering)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { completed } = req.query;
    let query = "SELECT * FROM todos";
    const params: any[] = [];

    if (completed === "true") {
      query += " WHERE completed = ?";
      params.push(1); // MySQL uses 1 for true
    } else if (completed === "false") {
      query += " WHERE completed = ?";
      params.push(0);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST - Create a new todo
router.post("/", async (req: Request<{}, {}, CreateTodoDTO>, res: Response) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)",
      [title, description ?? "", false],
    );

    const insertId = (result as any).insertId;

    // Fetch the newly created item to return it
    const [rows] = await pool.execute("SELECT * FROM todos WHERE id = ?", [
      insertId,
    ]);
    res.status(201).json((rows as any)[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// GET single todo
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [rows]: any = await pool.execute("SELECT * FROM todos WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Todo not Found !!" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

// PUT - Update todo
router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { title, description, completed } = req.body;
  try {
    const [result]: any = await pool.execute(
      "UPDATE todos SET title = ?, description = ?, completed = ? WHERE id = ?",
      [title, description, completed, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Todo not Found !!" });
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// PATCH - Toggle completed status
router.patch(
  "/:id/toggle",
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      // We update using a subquery to flip the boolean: NOT completed
      const [result]: any = await pool.execute(
        "UPDATE todos SET completed = NOT completed WHERE id = ?",
        [req.params.id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Todo not Found !!" });
      }

      const [rows]: any = await pool.execute(
        "SELECT * FROM todos WHERE id = ?",
        [req.params.id],
      );
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Toggle failed" });
    }
  },
);

// DELETE
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const [result]: any = await pool.execute("DELETE FROM todos WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Todo not Found !!" });
    }
    res.json({ message: "Todo Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
