import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';
import { SoftDelete } from '../config/soft-delete';

@SoftDelete()
@Entity()
export class LargeText extends BaseEntity {

  @Property({ type: 'text' })
  text: string
}
