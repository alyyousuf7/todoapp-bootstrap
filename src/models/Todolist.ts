import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Todoitem } from "./Todoitem";
import { User } from "./User";

@Entity()
export class Todolist {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    title: string;

    @OneToMany(type => Todoitem, todoitem => todoitem.todolist)
    todoItems: Todoitem[];

    @ManyToOne(type => User)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
