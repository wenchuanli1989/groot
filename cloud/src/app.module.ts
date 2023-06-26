import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { WorkbenchController } from './workbench.controller';
import config from 'config/mikro-orm.config';
import { PropBlockService } from 'service/prop-block.service';
import { PropGroupService } from 'service/prop-group.service';
import { PropItemService } from 'service/prop-item.service';
import { ComponentService } from 'service/component.service';
import { ApplicationService } from 'service/application.service';
import { OrgService } from 'service/org.service';
import { CommonService } from 'service/common.service';
import { PropValueService } from 'service/prop-value.service';
import { ComponentVersionService } from 'service/component-version.service';
import { ComponentInstanceService } from 'service/component-instance.service';
import { ReleaseService } from 'service/release.service';
import { AssetService } from 'service/asset.service';
import { ResourceService } from 'service/resource.service';
import { AssetController } from 'asset.controller';
import { SolutionService } from 'service/solution.service';
import { ExtensionInstanceService } from 'service/extension-instance.service';
import { SolutionVersionService } from 'service/solution-version.service';
@Module({
  imports: [
    MikroOrmModule.forRoot(config)
  ],
  controllers: [WorkbenchController, AssetController],
  providers: [
    PropItemService,
    PropBlockService,
    PropGroupService,
    ComponentService,
    ApplicationService,
    OrgService,
    CommonService,
    PropValueService,
    ComponentVersionService,
    ComponentInstanceService,
    ReleaseService,
    AssetService,
    ResourceService,
    SolutionService,
    ExtensionInstanceService,
    SolutionVersionService
  ],
})
export class AppModule { }
