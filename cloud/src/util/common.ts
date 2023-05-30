import { wrap } from "@mikro-orm/core";
import { AppResource } from "entities/AppResource";
import { InstanceResource } from "entities/InstanceResource";
import { ResourceConfig } from "entities/ResourceConfig";

export function isDevMode() {
  return process.env.NODE_ENV !== 'production'
}

export function autoIncrementForName(names: string[]) {

  const serial = names
    .map(g => g.replace(/^\D+/mg, ''))
    .map(s => parseInt(s) || 0)
    .sort((a, b) => b - a)[0] || 0;

  const nameSuffix = serial ? serial + 1 : names.length + 1;

  return nameSuffix;
}

export function parseResource(resource: AppResource | InstanceResource, resourceConfigMap: Map<number, ResourceConfig>) {
  const _resource = resource.imageResource ? resource.imageResource : resource

  const resourceConfig = _resource.resourceConfig;
  if (resourceConfig) {
    resourceConfigMap.set(resourceConfig.id, wrap(resourceConfig).toObject())
  }
  return wrap(_resource).toObject();
}

