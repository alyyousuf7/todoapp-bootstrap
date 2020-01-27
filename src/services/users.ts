import { getConnection } from "typeorm";

import { User } from "../models/User";
import Boom from "@hapi/boom";

export async function getAllUsers(offset: number, limit: number, select: (keyof User)[] = ['id', 'username']) {
    const userRepo = getConnection().getRepository(User);

    return userRepo.findAndCount({
        take: limit,
        skip: offset,
        select,
    });
}

export async function getUser(username: string) {
    const userRepo = getConnection().getRepository(User);

    const user = await userRepo.findOne({
        where: [
            { id: username },
            { username },
        ],
    });

    if (!user) {
        throw Boom.notFound('Could not find a user with this username or id');
    }

    return user;
}

export async function getUserByAPIKey(apiKey: string) {
    const userRepo = getConnection().getRepository(User);

    const user = await userRepo.findOne({
        where: { apiKey },
    });

    if (!user) {
        throw Boom.notFound('Could not find a user with this API Key');
    }

    return user;
}

export async function getUserAPIKey(username: string) {
    const user = await getUser(username);

    return user.apiKey;
}

export async function createUser(username: string) {
    const userRepo = getConnection().getRepository(User);

    const user = userRepo.create({ username });
    await userRepo.save(user);

    return user;
}

export async function deleteUser(username: string) {
    const userRepo = getConnection().getRepository(User);

    const user = await getUser(username);

    await userRepo.delete(user);
}
