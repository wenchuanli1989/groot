import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { PropBlock } from 'entities/PropBlock';
import { PropGroup } from 'entities/PropGroup';
import { PropItem } from 'entities/PropItem';
import { ApplicationService } from 'service/application.service';
import { PropBlockService } from 'service/prop-block.service';
import { PropGroupService } from 'service/prop-group.service';
import { PropItemService } from 'service/prop-item.service';
import { OrgService } from 'service/org.service';
import { PropValueService } from 'service/prop-value.service';
import { PropValue } from 'entities/PropValue';
import { Component } from 'entities/Component';
import { ComponentVersionService } from 'service/component-version.service';
import { ComponentVersion } from 'entities/ComponentVersion';
import { ComponentInstanceService } from 'service/component-instance.service';
import { ComponentInstance } from 'entities/ComponentInstance';
import { ReleaseService } from 'service/release.service';
import { Release } from 'entities/Release';
import { StandardResultInterceptor } from 'config/standard-result.interceptor';
import { AssetService } from 'service/asset.service';
import { ResourceService } from 'service/resource.service';
import { EnvType, StudioMode } from '@grootio/common';
import { SolutionService } from 'service/solution.service';
import { ComponentService } from 'service/component.service';
import { InstanceResource } from 'entities/InstanceResource';
import { AppResource } from 'entities/AppResource';
import { ExtensionInstanceService } from 'service/extension-instance.service';
import { SolutionVersionService } from 'service/solution-version.service';
import { SolutionComponentService } from 'service/solution-component.service'

@UseInterceptors(StandardResultInterceptor)
@Controller('/workbench')
export class WorkbenchController {
  constructor(
    private readonly propItemService: PropItemService,
    private readonly blockService: PropBlockService,
    private readonly groupService: PropGroupService,
    private readonly componentService: ComponentService,
    private readonly applicationService: ApplicationService,
    private readonly orgService: OrgService,
    private readonly propValueService: PropValueService,
    private readonly componentVersionService: ComponentVersionService,
    private readonly componentInstanceService: ComponentInstanceService,
    private readonly releaseService: ReleaseService,
    private readonly assetService: AssetService,
    private readonly resourceService: ResourceService,
    private readonly solutionService: SolutionService,
    private readonly extensionInstanceService: ExtensionInstanceService,
    private readonly solutionVersionService: SolutionVersionService,
    private readonly solutionComponentService: SolutionComponentService
  ) { }

  @Post('/component/add')
  async componentAdd(@Body() component: Component) {
    return await this.componentService.add(component);
  }

  @Post('/group/add')
  async groupAdd(@Body() group: PropGroup) {
    return this.groupService.add(group);
  }

  @Post('/group/update')
  async groupUpdate(@Body() group: PropGroup) {
    await this.groupService.update(group);
  }

  @Get('/group/remove/:groupId')
  async groupRemove(@Param('groupId') groupId: number) {
    await this.groupService.remove(groupId);
  }

  @Post('/block/add')
  async blockAdd(@Body() block: PropBlock) {
    return this.blockService.add(block);
  }

  @Post('/block/update')
  async blockUpdate(@Body() block: PropBlock) {
    await this.blockService.update(block);
  }

  @Get('/block/remove/:blockId')
  async blockRemove(@Param('blockId') blockId: number) {
    await this.blockService.remove(blockId);
  }

  @Post('/item/add')
  async itemAdd(@Body() item: PropItem) {
    return this.propItemService.add(item);
  }

  @Post('/item/update')
  async itemUpdate(@Body() item: PropItem) {
    return await this.propItemService.update(item);
  }

  @Get('/item/remove/:itemId')
  async itemRemove(@Param('itemId') itemId: number) {
    return await this.propItemService.remove(itemId);
  }

  @Post('/move/position')
  async movePosition(@Body() data: { originId: number, targetId: number, type: 'group' | 'block' | 'item' }) {
    // 将 origin 移动至 target位置，target 向后一一位
    if (data.type === 'group') {
      return await this.groupService.movePosition(data.originId, data.targetId);
    } else if (data.type === 'block') {
      return await this.blockService.movePosition(data.originId, data.targetId);
    } else if (data.type === 'item') {
      return await this.propItemService.movePosition(data.originId, data.targetId);
    }
  }

  @Post('/block/list-struct-primary-item/save')
  async blockListStructPrimaryItemSave(@Body('blockId') blockId: number, @Body('data') data: string) {
    await this.blockService.listStructPrimaryItemSave(blockId, data);
  }

  @Post('/value/abstract-type/add')
  async valueAbstractTypeAdd(@Body() rawPropValue: PropValue) {
    return await this.propValueService.abstractTypeAdd(rawPropValue);
  }

  @Get('/value/abstract-type/remove/:propValueId')
  async valueAbstractTypeRemove(@Param('propValueId') propValueId: number) {
    return await this.propValueService.abstractTypeRemove(propValueId);
  }

  @Post('/value/update')
  async valueUpdate(@Body() rawPropValue: PropValue) {
    return await this.propValueService.update(rawPropValue);
  }

  @Post('/component-instance/add-entry')
  async componentInstanceAddEntry(@Body() componentInstance: ComponentInstance) {
    return await this.componentInstanceService.addEntry(componentInstance);
  }


  @Get('/org/detail/:orgId')
  async orgDetail(@Param('orgId') orgId: number) {
    return this.orgService.getDetail(orgId);
  }

  @Get('/component/detail-by-componentVersionId-and-solutionVersionId')
  async componentDetailByComponentVersionId(@Query('componentVersionId') componentVersionId: number, @Query('solutionVersionId') solutionVersionId: number) {
    return this.componentService.componentDetailByComponentVersionId(+componentVersionId, +solutionVersionId);
  }

  @Get('/application/detail-by-releaseId/:releaseId')
  async getDetailByReleaseId(@Param('releaseId') releaseId: number) {
    return this.applicationService.getDetailByReleaseId(releaseId);
  }

  @Get('/component-instance/entry-detail-by-entryId-and-releaseId')
  async componentInstanceEntryDetailByEntryIdAndReleaseId(@Query('entryId') entryId: number, @Query('releaseId') releaseId: number) {
    return this.componentInstanceService.getEntryDetailByEntryIdAndReleaseId(entryId, releaseId);
  }

  @Post('/component-version/add')
  async componentVersionAdd(@Body() componentVersion: ComponentVersion) {
    return await this.componentVersionService.add(componentVersion);
  }

  // 基于特定迭代创建新迭代
  @Post('/release/add')
  async releaseAdd(@Body() release: Release) {
    return await this.releaseService.add(release);
  }


  @Get('/component-instance/reverse-detect-id')
  async componentInstanceReverseDetectId(@Query('releaseId') releaseId: number, @Query('trackId') trackId: number) {
    return await this.componentInstanceService.reverseDetectId(trackId, releaseId);
  }

  @Post('/component-version/publish')
  async componentVersionPublish(@Body('componentVersionId') componentVersionId: number) {
    await this.componentVersionService.publish(componentVersionId);
  }


  @Post('/asset/build')
  async assetBuild(@Body('releaseId') releaseId: number) {
    return this.assetService.build(releaseId);
  }


  @Post('/asset/publish')
  async assetPublish(@Body('deployId') deployId: number) {
    return this.assetService.publish(deployId);
  }

  @Post('/asset/create-deploy')
  async assetCreateDeploy(@Body('bundleId') bundleId: number, @Body('env') env: EnvType) {
    return this.assetService.createDeploy(bundleId, env);
  }

  @Post('/component-instance/add-child')
  async componentInstanceAddChild(@Body() rawInstance: ComponentInstance) {
    return await this.componentInstanceService.addChild(rawInstance);
  }

  @Get('/component-instance/remove/:instanceId')
  async componentInstanceRemove(@Param('instanceId') instanceId: number) {
    return await this.componentInstanceService.remove(instanceId);
  }

  @Post('/resource/add-instance-resource')
  async addInstanceResource(@Body() rawResource: InstanceResource) {
    return await this.resourceService.addInstanceResource(rawResource);
  }

  @Post('/resource/add-app-resource')
  async addAppResource(@Body() rawResource: AppResource) {
    return await this.resourceService.addAppResource(rawResource);
  }

  @Get('/resource/remove/:resourceId')
  async resourceRemove(@Param('resourceId') resourceId: number, @Query('type') type: string) {
    return await this.resourceService.remove(resourceId, type as any);
  }

  @Post('/resource/update-app-resource')
  async updateAppResource(@Body() rawResource: AppResource) {
    return await this.resourceService.updateAppResource(rawResource);
  }

  @Post('/resource/update-instance-resource')
  async updateInstanceResource(@Body() rawResource: InstanceResource) {
    return await this.resourceService.updateInstanceResource(rawResource);
  }

  @Get('/demo')
  async demo() {
    return [
      { id: 1, name: '张三', age: 22, address: '上海长宁' },
      { id: 2, name: '李四', age: 45, address: '北京海淀' },
      { id: 3, name: '王五', age: 18, address: '河南开封' },
      { id: 4, name: '小六', age: 30, address: '美国纽约' },
    ]
  }

  @Get('/resource-demo/demo1')
  async resourceDemo1() {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
    return 'demo1-text1'
  }

  @Get('/resource-demo/demo2')
  async resourceDemo2() {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
    return 'demo2-text2'
  }

  @Get('/account')
  async account() {
    const org = await this.orgService.getDetail(1)
    return {
      org
    }
  }

  @Get('/solution/detail-by-solutionVersionId/:solutionVersionId')
  async detailBySolutionVersionId(@Param('solutionVersionId') solutionVersionId: number) {
    return await this.solutionService.getDetailBySolutionVersionId(solutionVersionId)
  }

  // todo 添加解决方案实现
  @Get('/solution-component/list/:solutionVersionId')
  async solutionCompoentList(@Param('solutionVersionId') solutionVersionId: number, @Query('all') all: string, @Query('allVersion') allVersion: string) {
    return await this.solutionComponentService.list(solutionVersionId, all === 'true', allVersion === 'true');
  }


  @Get('/application/release-list/:appId')
  async componentList(@Param('appId') appId: number) {
    return await this.releaseService.list(appId)
  }

  @Get('/secret-core')
  async getSecretCore(@Query('mode') mode: StudioMode, @Query('releaseId') releaseId: string, @Query('solutionVersionId') solutionVersionId: string) {

    return await this.extensionInstanceService.getSecret({ mode, releaseId: +releaseId, solutionVersionId: +solutionVersionId })
  }

  @Get('/componentVersion/get-by-solutionVersionId-and-componentId')
  async getBySolutionVersionIdAndComponentId(@Query('solutionVersionId') solutionVersionId: number, @Query('componentId') componentId: number) {
    return await this.componentVersionService.getBySolutionVersionIdAndComponentId(solutionVersionId, componentId)
  }

  @Post('/solution-version/add')
  async solutionVersionAdd(@Body('imageVersionId') imageVersionId: number, @Body('name') name: string) {
    return await this.solutionVersionService.add(imageVersionId, name)
  }

  @Post('/solution-version/remove-component-version')
  async solutionVersionRemoveComponentVersion(@Body('solutionVersionId') solutionVersionId: number, @Body('componentVersionId') componentVersionId: number) {
    return await this.solutionVersionService.removeComponentVersion(solutionVersionId, componentVersionId)
  }
}
