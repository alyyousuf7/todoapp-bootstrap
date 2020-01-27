import express, { Router } from "express";
import Boom from "@hapi/boom";
import Joi from "@hapi/joi";

import { wrapAsync } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/authenticate";
import { getTodolist } from "../services/todolists";
import { getTodoitemsForUser, addTodoitems, removeTodoitemsForUser, updateTodoitemsForUser } from "../services/todoitems";

const router = Router();

/**
 * @swagger
 * /todos/{todolistId}/items:
 *   get:
 *     tags:
 *       - Todoitem
 *     summary: List
 *     description: Returns paginated Todo items for a Todo list
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     parameters:
 *       - $ref: '#/components/parameters/offset'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/todolistId'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoitemPagination'
 *             example:
 *               total: 2
 *               data:
 *                 - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                   completed: false
 *                   description: Buy tickets
 *                 - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                   completed: true
 *                   description: Arrange a camping tent
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/todos/:todolistId/items', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { limit, offset, todolistId } = await Joi
        .object({
            offset: Joi.number().integer().default(0).failover(0),
            limit: Joi.number().integer().default(10).failover(10),
            todolistId: Joi.string().uuid().required(),
        })
        .validateAsync({
            offset: req.query.offset,
            limit: req.query.limit,
            todolistId: req.params.todolistId,
        });

    const list = await getTodolist(todolistId);
    if (list.userId !== req.user.id) {
        throw Boom.forbidden('You do not have access to this resource');
    }

    const [items, total] = await getTodoitemsForUser(req.user.id, todolistId, offset, limit);

    res.send({
        total,
        data: items.map((item) => ({ id: item.id, completed: item.completed, description: item.description })),
    });
}));

/**
 * @swagger
 * /todos/{todolistId}/items:
 *   post:
 *     tags:
 *       - Todoitem
 *     summary: Bulk Create
 *     description: Create Todo items in bulk for a Todo list
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     parameters:
 *       - $ref: '#/components/parameters/todolistId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               description: Todoitem description
 *               type: string
 *               minimum: 3
 *               maximum: 255
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todoitem'
 *             example:
 *               - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                 completed: false
 *                 description: Buy tickets
 *               - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                 completed: false
 *                 description: Arrange a camping tent
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
router.post('/todos/:todolistId/items', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { todolistId, items } = await Joi
        .object({
            todolistId: Joi.string().uuid().required(),
            items: Joi.array().items(
                Joi.string().min(3).max(255)
            ).min(1).required(),
        })
        .validateAsync({
            todolistId: req.params.todolistId,
            items: req.body,
        });

    const list = await getTodolist(todolistId);
    if (list.userId !== req.user.id) {
        throw Boom.forbidden('You do not have access to this resource');
    }

    const _items = await addTodoitems(todolistId, items);

    res.status(201).send(_items.map((item) => ({ id: item.id, completed: item.completed, description: item.description })));
}));

/**
 * @swagger
 * /items:
 *   patch:
 *     tags:
 *       - Todoitem
 *     summary: Bulk Update
 *     description: Update Todo items in bulk
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Todoitem'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todoitem'
 *             example:
 *               - id: c43a3b0d-e794-4a9c-9c12-e35c6b62de4c
 *                 completed: false
 *                 description: Buy tickets
 *               - id: 2efa52e2-e9fd-4bd0-88bc-0132b2e837d9
 *                 completed: true
 *                 description: Arrange a camping tent
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/items', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { items } = await Joi
        .object({
            items: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid().required(),
                    description: Joi.string().min(3).max(255),
                    completed: Joi.bool(),
                })
            ).min(1).required(),
        })
        .validateAsync({
            items: req.body,
        });

    const _items = await updateTodoitemsForUser(req.user.id, items);

    res.send(_items.map((item) => ({ id: item.id, completed: item.completed, description: item.description })));
}));

/**
 * @swagger
 * /items:
 *   delete:
 *     tags:
 *       - Todoitem
 *     summary: Bulk Delete
 *     description: Delete Todo items in bulk
 *     security:
 *       - APIKeyHeader: []
 *       - APIKeyQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               description: Todoitem ID
 *               type: string
 *               format: uuid
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/items', wrapAsync(authenticate), wrapAsync(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { itemIds } = await Joi
        .object({
            itemIds: Joi.array().items(
                Joi.string().uuid()
            ).min(1).required(),
        })
        .validateAsync({
            itemIds: req.body,
        });

    await removeTodoitemsForUser(req.user.id, itemIds);

    res.send(204);
}));

export default router;
