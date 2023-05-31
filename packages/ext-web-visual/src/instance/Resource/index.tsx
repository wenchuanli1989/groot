import { Popover, Typography } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useRegisterModel } from "@grootio/common";

import styles from './index.module.less';
import ResourceModel from "./ResourceModel";
import ResourceForm from "./ResourceForm";
import { grootManager } from "context";

const ResourceList = () => {
  const resourceModel = useRegisterModel(ResourceModel);
  const [globalResourceList] = grootManager.state.useStateByName('gs.globalResourceList')
  const [localResourceList] = grootManager.state.useStateByName('gs.localResourceList')

  return <div className={styles.container}>
    {
      [
        {
          title: '全局',
          key: 'global',
          list: globalResourceList
        }, {
          title: '页面',
          key: 'page',
          list: localResourceList
        }
      ].map((data) => {
        return <div className={styles.groupContainer} key={data.key}>
          <div className={styles.groupBar}>
            <div className={styles.groupTitle}>{data.title}</div>

            <Popover overlayClassName={styles.popoverOverlay} content={<ResourceForm />} trigger={['click']} placement="rightTop"
              open={resourceModel.formVisible && !resourceModel.currResource && (data.key === 'global' ? resourceModel.isLocalResource : !resourceModel.isLocalResource)} >
              <Typography.Link className={styles.groupAction} disabled={resourceModel.formVisible} onClick={() => {
                resourceModel.showForm(data.key === 'page');
              }} >
                <PlusOutlined />
              </Typography.Link>
            </Popover>
          </div>

          <div className={styles.itemContainer}>
            {data.list.map(item => {
              return <div className={styles.item} key={item.id}>
                <div className={styles.itemTitle}>{item.name}</div>

                <Popover overlayClassName={styles.popoverOverlay} content={<ResourceForm />} trigger={['click']} open={resourceModel.formVisible && resourceModel.currResource?.id === item.id} placement="rightTop">
                  <Typography.Link className={styles.itemAction} hidden={item.readonly} disabled={resourceModel.formVisible} onClick={() => {
                    resourceModel.showForm(!(item as any).appId, item)
                  }} >
                    <EditOutlined />
                  </Typography.Link>
                </Popover>
              </div>
            })}
          </div>
        </div>
      })
    }
  </div>

}

export default ResourceList;