
export enum PropItemStruct {
  Normal = 1,
  Hierarchy = 2,
  Flat = 3,
  Component = 4
}

export enum PropItemViewType {
  Text = 'text',
  Textarea = 'textarea',
  Number = 'number',
  Slider = 'slider',
  ButtonGroup = 'buttonGroup',
  Switch = 'switch',
  Select = 'select',
  Radio = 'radio',
  Checkbox = 'checkbox',
  DatePicker = 'datePicker',
  TimePicker = 'timePicker',
  Json = 'json',
  Function = 'function',
}

export enum PropBlockLayout {
  Horizontal = 1,
  Vertical = 2
}

export enum PropGroupStructType {
  Flat = 1,
  Default = 2
}

export enum PropBlockStructType {
  List = 1,
  Default = 2
}

export enum PropValueType {
  Instance = 1,
  Prototype = 2,
}

export enum EnvType {
  Dev = 1,
  Qa = 2,
  Pl = 3,
  Ol = 4
}

export enum EnvTypeStr {
  Dev = 'dev',
  Qa = 'qa',
  Pl = 'pl',
  Ol = 'online'
}

export enum DeployStatusType {
  Approval = 1,
  Ready = 2,
  Archive = 4
}


export enum ComponentParserType {
  ReactComponent = 1,
  VueComponent = 2,
  Http = 3,
  DataSource = 4,
}

export enum ValueStruct {
  Common = 1,
  /**
   * 存放子组件实例ID
   */
  ChildComponentList = 2
}

export enum StudioMode {
  Prototype = 'prototype',
  Instance = 'instance'
}

export enum ModalStatus {
  None = 'none',
  Init = 'init',
  Submit = 'submit'
}

export enum ViewportMode {
  PC = 'pc',
  H5 = 'h5'
}

export enum PropMetadataType {
  Component = 'component',
  Json = 'json',
  Function = 'function',
  DateTime = 'dateTime',
  Interpolation = 'interpolation'
}


export enum ExtensionPipelineLevel {
  Hight = 'hight',
  Normal = 'normal',
  Low = 'low',
  Ignore = 'ignore'
}

export enum ExtensionLevel {
  Entry = 'entry',
  Application = 'application',
  Solution = 'solution'
}

export enum ExtensionRelationType {
  Release = 1,
  Entry = 2,
  SolutionVersion = 3,
}

export enum ExtensionStatus {
  Active = 'active',
  Conflict = 'conflict',
  ConflictUrl = 'conflictUrl',
  Destroy = 'destroy',
  Uninstall = 'uninstall'
}