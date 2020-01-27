import express, { Router } from "express";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";

import { wrapAsync } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/authenticate";
import { getTodolistsForUser, getTodolist, createTodolistForUser, updateTodolist, removeTodolist } from "../services/todolists";
import { addTodoitems } from "../services/todoitems";

const router = Router();

/**
 * @swagger
 * /todos:
 *   get:
 *     tags:
 *       - Todolist
 *     summary: List
 *     description: Returns paginated Todo list
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     parameters:
 *       - $ref: '#/components/parameters/offset'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodolistPagination'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   title: Vacation Preparation
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   title: Final Year Project
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/todos', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { limit, offset } = await Joi
        .object({
            offset: Joi.number().integer().default(0).failover(0),
            limit: Joi.number().integer().default(10).failover(10),
        })
        .validateAsync({
            offset: req.query.offset,
            limit: req.query.limit,
        });

    const [lists, total] = await getTodolistsForUser(req.user.id, offset, limit);

    res.send({
        total,
        data: lists.map((list) => ({ id: list.id, title: list.title })),
    });
}));

/**
 * @swagger
 * /todos:
 *   post:
 *     tags:
 *       - Todolist
 *     summary: Create
 *     description: Create a Todo list with Todo items
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 description: Todolist title
 *                 type: string
 *                 minimum: 3
 *                 maximum: 255
 *               items:
 *                 description: Todoitems for the new todolist
 *                 type: array
 *                 items:
 *                   description: Todoitem description
 *                   type: string
 *                   minimum: 3
 *                   maximum: 255
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todolist'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               title: Vacation Preparation
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/todos', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { title, items } = await Joi
        .object({
            title: Joi.string().min(3).max(255).required(),
            items: Joi.array().items(Joi.string().min(3).max(255)),
        })
        .validateAsync({
            title: req.body.title,
            items: req.body.items,
        });

    const list = await createTodolistForUser(req.user.id, title);

    await addTodoitems(list.id, items);

    res.status(201).send({ id: list.id, title: list.title });
}));

/**
 * @swagger
 * /todos/{todolistId}:
 *   put:
 *     tags:
 *       - Todolist
 *     summary: Update
 *     description: Update a Todo list
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     parameters:
 *       - $ref: '#/components/parameters/todolistId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *            schema:
 *              type: object
 *              required:
 *                - title
 *              properties:
 *                title:
 *                  description: Todolist title
 *                  type: string
 *                  minimum: 3
 *                  maximum: 255
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todolist'
 *             example:
 *               id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *               title: Vacation Preparation
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/todos/:todolistId', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { todolistId, title } = await Joi
        .object({
            todolistId: Joi.string().uuid().required(),
            title: Joi.string().min(3).max(255).required(),
        })
        .validateAsync({
            todolistId: req.params.todolistId,
            title: req.body.title,
        });

    let list = await getTodolist(todolistId);
    if (list.userId !== req.user.id) {
        throw Boom.forbidden('You do not have access to this resource');
    }

    list.title = title;
    list = await updateTodolist(list);

    res.send({ id: list.id, title: list.title });
}));

/**
 * @swagger
 * /todos/{todolistId}:
 *   delete:
 *     tags:
 *       - Todolist
 *     summary: Delete
 *     description: Delete a Todo list
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     parameters:
 *       - $ref: '#/components/parameters/todolistId'
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/todos/:todolistId', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { todolistId } = await Joi
        .object({
            todolistId: Joi.string().uuid().required(),
        })
        .validateAsync({
            todolistId: req.params.todolistId,
        });

    let list = await getTodolist(todolistId);
    if (list.userId !== req.user.id) {
        throw Boom.forbidden('You do not have access to this resource');
    }

    await removeTodolist(list);

    res.send(204);
}));

export default router;
