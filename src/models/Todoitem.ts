import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Todolist } from "./Todolist";

@Entity()
export class Todoitem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column({ default: false })
    completed: boolean;

    @ManyToOne(type => Todolist, { onDelete: 'CASCADE' })
    todolist: Todolist;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
