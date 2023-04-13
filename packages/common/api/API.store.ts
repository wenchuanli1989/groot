import { SolutionInstance, State, Application, Component, ComponentInstance, ComponentVersion, Deploy, Organization, PropBlock, PropGroup, PropItem, PropValue, Release, Solution, ExtensionInstance } from '../entities';
import { EnvType } from '../enum';
import { API } from './API.common';
import type { APIPath } from './API.path';

/**
 * 请求服务器接口的规则列表
 * 格式 [key APIPath枚举值]: [请求参数类型 , 返回数据类型] 
 */
export type APIStore = {
  [APIPath.auth_currentAccount]: [null, API.Response<API.Account>];
  [APIPath.auth_logout]: [];
  [APIPath.system_dict]: [null, API.Response<Record<string, API.SystemDict[]>>];

  [APIPath.application_detail_applicationId]: [{ applicationId: number, releaseId?: number }, API.Response<Application>];
  [APIPath.solution_detail_solutionId]: [{ solutionId: number, solutionVersionId?: number }, API.Response<Solution>]
  [APIPath.move_position]: [{ originId: number, targetId: number, type: 'group' | 'block' | 'item' }];
  [APIPath.componentInstance_addChild]: [ComponentInstance, API.Response<ComponentInstance>];
  [APIPath.componentPrototype_detail_componentId]: [{ componentId: number, versionId?: number }, API.Response<Component>];
  [APIPath.org_detail_orgId]: [{ orgId: number }, API.Response<Organization>];
  [APIPath.component_add]: [Component, API.Response<Component>];
  [APIPath.componentVersion_add]: [ComponentVersion, API.Response<ComponentVersion>];
  [APIPath.componentVersion_publish]: [{ componentId: number, versioinId: number }];
  [APIPath.componentInstance_rootDetail_instanceId]: [{ instanceId: number }, API.Response<{
    children: ComponentInstance[],
    root: ComponentInstance,
    release: Release,
    entryExtensionInstanceList: ExtensionInstance[],
    solutionInstanceList: SolutionInstance[],
  }>];
  [APIPath.componentInstance_addRoot]: [ComponentInstance, API.Response<ComponentInstance>];
  [APIPath.release_add]: [Release, API.Response<Release>],
  [APIPath.componentInstance_reverseDetectId]: [Partial<ComponentInstance>, API.Response<number>],
  [APIPath.asset_build]: [{ releaseId: number }, API.Response<number>],
  [APIPath.asset_publish]: [{ deployId: number }, API.Response<number>],
  [APIPath.asset_create_deploy]: [{ bundleId: number, env: EnvType }, API.Response<Deploy>],
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

  [APIPath.state_add]: [State, API.Response<State>],
  [APIPath.state_remove_stateId]: [{ stateId: number }],
  [APIPath.state_update]: [State, API.Response<State>],

  [APIPath.solution_componentList_solutionVersionId]: [{ solutionVersionId: number, all: boolean }, API.Response<Component[]>],
  [APIPath.release_instanceList_releaseId]: [{ releaseId: number }, API.Response<ComponentInstance[]>],

  [APIPath.application_releaseList_applicationId]: [{ applicationId: number }, API.Response<Release[]>]

};


