/**
 * 服务器接口地址列表
 * 枚举值格式 [method get请求可以省略] + <url 接口地址>
 */
export enum APIPath {
  system_dict = 'system/dict',

  application_detailByReleaseId = 'application/detail-by-releaseId/:releaseId',
  org_detail_orgId = 'org/detail/:orgId',
  solution_detailBySolutionVersionId = 'solution/detail-by-solutionVersionId/:solutionVersionId',
  componentInstance_addChild = 'POST component-instance/add-child',
  componentInstance_remove_instanceId = 'component-instance/remove/:instanceId',
  component_detailByComponentVersionIdAndSolutionVersionId = 'component/detail-by-componentVersionId-and-solutionVersionId',
  component_add = 'POST component/add',
  componentVersion_add = 'POST component-version/add',
  componentVersion_publish = 'POST component-version/publish',
  componentInstance_entryDetailByEntryIdAndReleaseId = 'component-instance/entry-detail-by-entryId-and-releaseId',
  componentInstance_addEntry = 'POST component-instance/add-entry',
  componentInstance_reverseDetectId = 'component-instance/reverse-detect-id',
  release_add = 'POST release/add',
  asset_build = 'POST asset/build',
  asset_publish = 'POST asset/publish',

  asset_createDeploy = 'POST asset/create-deploy',

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

  resource_remove_resourceId = 'resource/remove/:resourceId',
  resource_addInstanceResource = 'POST resource/add-instance-resource',
  resource_addAppResource = 'POST resource/add-app-resource',
  resource_updateInstanceResource = 'POST resource/update-instance-resource',
  resource_updateAppResource = 'POST resource/update-app-resource',

  solutionComponent_list_solutionVersionId = 'solution-component/list/:solutionVersionId',

  application_releaseList_appId = 'application/release-list/:appId',

  secretCore = 'secret-core',
  componentVersion_getBySolutionVersionIdAndComponentId = 'componentVersion/get-by-solutionVersionId-and-componentId',
  solutionVersion_add = 'POST solution-version/add',
  solutionVersion_removeComponentVersion = 'POST solution-version/remove-component-version'
}
