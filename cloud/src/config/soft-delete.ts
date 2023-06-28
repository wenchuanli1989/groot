import { Filter } from "@mikro-orm/core";

export type SoftDeleteOptions = {
  enabled?: boolean;
  defaultIsDeleted?: boolean;
  field?: string;
};

const defaultOptions = { enabled: true, defaultIsDeleted: false, field: 'deletedAt' };

export const SoftDelete = (options: SoftDeleteOptions = {}): ClassDecorator => {
  const { enabled, defaultIsDeleted, field } = { ...defaultOptions, ...options };
  return Filter({
    name: 'softDelete',
    default: enabled,
    cond: ({ isDeleted = defaultIsDeleted }: { isDeleted?: boolean } = {}) => {
      // await this.em.find(User, {}) // only returns active records
      // await this.em.find(User, {}, { filters: { softDelete: { isDeleted: true} } }) // returns deleted records
      // await this.em.find(User, {}, { filters: { softDelete: { isDeleted: null} } }) // returns all

      if (isDeleted) {
        return { [field]: { $ne: null } }
      } else {
        return isDeleted === false ? { [field]: null } : {}
      }
    }
  });
};