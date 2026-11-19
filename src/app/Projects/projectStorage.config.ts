import { AuthnEnum, SystemTypeEnum } from '@tapis/tapis-typescript-systems';

export const projectStorageConfig = {
  host: 'cmaiki-v2-koa',
  systemType: SystemTypeEnum.Linux,
  defaultAuthnMethod: AuthnEnum.Password,
  effectiveUserId: '${apiUserId}',
  baseRootDir: '/',
};
