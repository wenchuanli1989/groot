import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { isDevMode } from '../util/common';

export default {
  metadataProvider: TsMorphMetadataProvider,
  entities: ['./dist/entities/**/*.js'],
  entitiesTs: ['./src/entities/**/*.ts'],
  dbName: 'demo1',
  user: 'demo1',
  password: '123456',
  type: 'mysql',
  persistOnCreate: true,
  highlighter: new SqlHighlighter(),
  schemaGenerator: {
    // 取消外键约束校验
    disableForeignKeys: false,
    // 取消创建外键约束
    createForeignKeyConstraints: false,
  },
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders',
  },

  // developer
  debug: isDevMode(),
  charset: 'utf8mb4'
} as MikroOrmModuleSyncOptions;

