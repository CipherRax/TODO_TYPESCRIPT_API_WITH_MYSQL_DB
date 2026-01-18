export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  created: Date;
}

export interface CreateTodoDTO {
  title: string;
  description?: string;
}
