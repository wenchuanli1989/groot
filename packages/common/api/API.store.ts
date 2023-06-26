import { SolutionInstance, Application, Component, ComponentInstance, ComponentVersion, Deploy, Organization, PropBlock, PropGroup, PropItem, PropValue, Release, Solution, ExtensionInstance, AppResource, InstanceResource, ResourceConfig, Resource, SolutionVersion } from '../entities';
import { EnvType, StudioMode } from '../enum';
import { ExtensionRuntime } from '../extension';
import { API } from './API.common';
import type { APIPath } from './API.path';

/**
 * 请求服务器接口的规则列表
 * 格式 [key APIPath枚举值]: [请求参数类型 , 返回数据类型] 
 */
export type APIStore = {
  [APIPath.system_dict]: [null, API.Response<Record<string, API.SystemDict[]>>];

  [APIPath.application_detailByReleaseId]: [{ releaseId: number }, API.Response<Application>];
  [APIPath.solution_detailBySolutionVersionId]: [{ solutionVersionId: number }, API.Response<Solution>]
  [APIPath.move_position]: [{ originId: number, targetId: number, type: 'group' | 'block' | 'item' }];
  [APIPath.componentInstance_addChild]: [ComponentInstance, API.Response<ComponentInstance>];
  [APIPath.component_detailByComponentVersionIdAndSolutionVersionId]: [{ componentVersionId: number, solutionVersionId: number }, API.Response<Component>];
  [APIPath.org_detail_orgId]: [{ orgId: number }, API.Response<Organization>];
  [APIPath.component_add]: [Component, API.Response<Component>];
  [APIPath.componentVersion_add]: [ComponentVersion, API.Response<ComponentVersion>];
  [APIPath.componentVersion_publish]: [{ componentVersionId: number }];
  [APIPath.componentInstance_entryDetailByEntryIdAndReleaseId]: [{ entryId: number, releaseId: number }, API.Response<{
    children: ComponentInstance[],
    root: ComponentInstance,
    entryExtensionInstanceList: ExtensionRuntime[],
    solutionInstanceList: SolutionInstance[],
    resourceList: Resource[],
    resourceConfigList: ResourceConfig[]
  }>];
  [APIPath.componentInstance_addEntry]: [ComponentInstance, API.Response<ComponentInstance>];
  [APIPath.release_add]: [Release, API.Response<Release>],
  [APIPath.componentInstance_reverseDetectId]: [Partial<ComponentInstance>, API.Response<number>],
  [APIPath.asset_build]: [{ releaseId: number }, API.Response<number>],
  [APIPath.asset_publish]: [{ deployId: number }, API.Response<number>],
  [APIPath.asset_createDeploy]: [{ bundleId: number, env: EnvType }, API.Response<Deploy>],
  [APIPath.group_update]: [PropGroup],
  [APIPath.group_add]: [PropGroup, API.Response<{
    newGroup: PropGroup,
    extra?: {
      newBlock: PropBlock,
      extra?: {
        newItem: PropItem,
        childGroup?: PropGroup,
        propValue?: PropValue
      }
    }
  }>],
  [APIPath.block_update]: [PropBlock],
  [APIPath.block_add]: [PropBlock, API.Response<{
    newBlock: PropBlock,
    extra?: {
      newItem: PropItem,
      childGroup?: PropGroup,
      propValue?: PropValue
    }
  }>],
  [APIPath.item_update]: [PropItem, API.Response<PropItem>],
  [APIPath.item_add]: [PropItem, API.Response<{
    newItem: PropItem,
    childGroup?: PropGroup,
    extra?: {
      newBlock?: PropBlock
    }
  }>],
  [APIPath.group_remove_groupId]: [{ groupId: number }],
  [APIPath.block_remove_blockId]: [{ blockId: number }],
  [APIPath.item_remove_itemId]: [{ itemId: number }],
  [APIPath.block_listStructPrimaryItem_save]: [{ blockId: number, data: string }],
  [APIPath.value_abstractType_add]: [PropValue, API.Response<PropValue>],
  [APIPath.value_abstractType_remove_propValueId]: [{ propValueId: number }],
  [APIPath.value_update]: [PropValue, API.Response<PropValue>],
  [APIPath.componentInstance_remove_instanceId]: [{ instanceId: number }],

  [APIPath.resource_addAppResource]: [AppResource, API.Response<AppResource>],
  [APIPath.resource_addInstanceResource]: [InstanceResource, API.Response<InstanceResource>],
  [APIPath.resource_updateAppResource]: [AppResource, API.Response<AppResource>],
  [APIPath.resource_updateInstanceResource]: [InstanceResource, API.Response<InstanceResource>],

  [APIPath.resource_remove_resourceId]: [{ resourceId: number, type: 'app' | 'instance' | 'project' }],

  [APIPath.solution_componentList_solutionVersionId]: [{ solutionVersionId: number, all?: boolean, allVersion?: boolean }, API.Response<Component[]>],

  [APIPath.application_releaseList_appId]: [{ appId: number }, API.Response<Release[]>],

  [APIPath.secretCore]: [{ mode: StudioMode, releaseId: string, solutionVersionId: string }, API.Response<ExtensionInstance>],
  [APIPath.componentVersion_getBySolutionVersionIdAndComponentId]: [{ solutionVersionId: number, componentId: number }, API.Response<ComponentVersion>],
  [APIPath.solutionVersion_add]: [{ imageVersionId: number, name: string }, API.Response<SolutionVersion>]
  [APIPath.solutionVersion_removeComponentVersion]: [{ solutionVersionId: number, componentVersionId: number }, API.Response<void>]
};


