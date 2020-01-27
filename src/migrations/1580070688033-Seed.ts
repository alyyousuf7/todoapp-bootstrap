import { MigrationInterface, QueryRunner, getRepository } from "typeorm";
import { User } from "../models/User";

export class Seed1580070688033 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const user = getRepository(User).create({
            username: 'user1',
        });

        await getRepository(User).save(user);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const user = await getRepository(User).findOne({
            where: { username: 'user1' },
        });

        await getRepository(User).remove(user);
    }
}
