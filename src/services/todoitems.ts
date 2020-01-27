import { getConnection } from "typeorm";

import log from "../utils/logger";
import { Todoitem } from "../models/Todoitem";

export async function getTodoitemsForUser(userId: string, todolistId: string, offset: number, limit: number) {
    const todoitemRepo = getConnection().getRepository(Todoitem);

    return todoitemRepo.findAndCount({
        skip: offset,
        take: limit,
        where: { userId, list: todolistId },
    });
}

export async function addTodoitems(todolistId: string, items: string[]) {
    const todoitemRepo = getConnection().getRepository(Todoitem);

    const todoitems = items.map((description) => {
        return todoitemRepo.create({
            todolist: { id: todolistId },
            description,
        });
    });

    return todoitemRepo.save(todoitems);
}

export async function updateTodoitemsForUser(userId: string, items: Todoitem[]) {
    const todoitemRepo = getConnection().getRepository(Todoitem);

    const todoitemIds = items
        .filter((item) => item.description != undefined || item.completed != undefined)
        .map((item) => item.id);

    if (!todoitemIds.length) {
        return [];
    }

    const [_items, total] = await todoitemRepo.createQueryBuilder('item')
        .leftJoin('item.todolist', 'list')
        .whereInIds(todoitemIds)
        .andWhere('list.userId = :userId', { userId })
        .getManyAndCount();

    for (const item of _items) {
        const newItem = items.find((i) => i.id == item.id);
        if (!newItem) {
            throw new Error('Unexpected behaviour');
        }

        item.description = newItem.description;
        item.completed = newItem.completed;
    }

    const newItems = await todoitemRepo.save(_items, { reload: true });
    log.debug(`Updated ${total} items`);

    return newItems;
}

export async function removeTodoitemsForUser(userId: string, todoitemIds: string[]) {
    const todoitemRepo = getConnection().getRepository(Todoitem);

    if (!todoitemIds.length) {
        return 0;
    }

    const [items, total] = await todoitemRepo.createQueryBuilder('item')
        .leftJoin('item.todolist', 'list')
        .whereInIds(todoitemIds)
        .andWhere('list.userId = :userId', { userId })
        .getManyAndCount();
    
    await todoitemRepo.remove(items);
    log.debug(`Deleted ${total} items`);

    return total;
}
