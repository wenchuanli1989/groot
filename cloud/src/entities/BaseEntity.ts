import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {

  @PrimaryKey()
  id: number;

  // 在没有明确查询时不返回该字段值
  @Property({ lazy: true })
  createdAt = new Date();

  // 在没有明确查询时不返回该字段值
  @Property({ onUpdate: () => new Date(), lazy: true })
  updatedAt = new Date();

  @Property({ lazy: true })
  deletedAt?: Date

  // todo 添加创建人和更新人，自动从会话中抓取
}
