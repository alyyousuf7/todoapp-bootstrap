import { getConnection } from "typeorm";

import { Todolist } from "../models/Todolist";
import Boom from "@hapi/boom";

export async function getTodolistsForUser(userId: string, offset: number, limit: number) {
    const todolistRepo = getConnection().getRepository(Todolist);

    return todolistRepo.findAndCount({
        skip: offset,
        take: limit,
        where: { userId },
    });
}

export async function getTodolist(todolistId: string) {
    const todolistRepo = getConnection().getRepository(Todolist);

    const list = await todolistRepo.findOne({
        where: { id: todolistId },
    });

    if (!list) {
        throw Boom.notFound('Todo list not found');
    }

    return list;
}

export async function createTodolistForUser(userId: string, title: string) {
    const todolistRepo = getConnection().getRepository(Todolist);

    const todolist = todolistRepo.create({
        userId,
        title,
    });

    return todolistRepo.save(todolist);
}

export async function updateTodolist(todolist: Todolist) {
    const todolistRepo = getConnection().getRepository(Todolist);

    return todolistRepo.save(todolist, { reload: true });
}

export async function removeTodolist(todolist: Todolist) {
    const todolistRepo = getConnection().getRepository(Todolist);

    return todolistRepo.remove(todolist);
}
