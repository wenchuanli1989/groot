/**
 * 服务器接口地址列表
 * 枚举值格式 [method get请求可以省略] + <url 接口地址>
 */
export enum APIPath {
  auth_currentAccount = 'auth/current-account',
  auth_logout = 'auth/logout',
  system_dict = 'system/dict',

  application_detail_applicationId = 'application/detail/:applicationId',
  org_detail_orgId = 'org/detail/:orgId',
  solution_detail_solutionId = 'solution/detail/:solutionId',
  componentInstance_addChild = 'POST component-instance/add-child',
  componentInstance_remove_instanceId = 'component-instance/remove/:instanceId',
  componentPrototype_detail_componentId = 'component-prototype/detail/:componentId?versionId=:versionId',
  component_add = 'POST component/add',
  componentVersion_add = 'POST component-version/add',
  componentVersion_publish = 'POST component-version/publish',
  componentInstance_rootDetail_instanceId = 'component-instance/root-detail/:instanceId',
  componentInstance_addRoot = 'POST component-instance/add-root',
  componentInstance_reverseDetectId = 'component-instance/reverse-detect-id',
  release_add = 'POST release/add',
  asset_build = 'POST asset/build',
  asset_publish = 'POST asset/publish',

  asset_create_deploy = 'POST asset/create-deploy',

  item_update = 'POST item/update',
  item_add = 'POST item/add',
  item_remove_itemId = 'item/remove/:itemId',
  block_update = 'POST block/update',
  block_add = 'POST block/add',
  block_remove_blockId = 'block/remove/:blockId',
  block_listStructPrimaryItem_save = 'POST block/list-struct-primary-item/save',
  group_remove_groupId = 'group/remove/:groupId',
  group_update = 'POST group/update',
  group_add = 'POST group/add',
  value_abstractType_add = 'POST value/abstract-type/add',
  value_abstractType_remove_propValueId = 'value/abstract-type/remove/:propValueId',
  value_update = 'POST value/update',
  move_position = 'POST move/position',

  state_add = 'POST state/add',
  state_remove_stateId = 'state/remove/:stateId',
  state_update = 'POST state/update',

  solution_componentList_solutionVersionId = 'solution/component-list/:solutionVersionId',

  release_instanceList_releaseId = 'release/instance-list/:releaseId',

  application_releaseList_applicationId = 'application/release-list/:applicationId'

}
