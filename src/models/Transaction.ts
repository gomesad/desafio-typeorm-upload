import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import Category from './Category';

@Entity('transactions')
class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('enum')
  type: 'income' | 'outcome';

  @Column('double precision')
  value: number;

  @ManyToOne(_ => Category, category => category.transactions)
  @JoinColumn({
    name: 'category_id',
    referencedColumnName: 'id',
  })
  category: Category;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Transaction;
