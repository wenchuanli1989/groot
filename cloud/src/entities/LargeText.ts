import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './BaseEntity';

@Entity()
export class LargeText extends BaseEntity {

  @Property({ type: 'text' })
  text: string
}
