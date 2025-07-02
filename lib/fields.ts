import { DeviceTypes } from './constants';

type EquipmentStatusFieldsType = {
  [fieldName in keyof typeof DeviceTypes]: readonly string[]
};

export const EquipmentStatusFields: EquipmentStatusFieldsType = {
  AGL: [
    'voltR',
    'voltG',
    'ampR',
    'ampG',
    'ampOff',
    'dutyR',
    'dutyG',
    'outStat',
    'tempStat',
    'powerLimit',
    'dirStat',
    'modeStat',
    'commStat',
    'pubNo',
    'firmwareResetCount',
    'dispErrId',
    'dispAbnormalStat',
    'version',
    'timestamp',
  ] as const,
  DGL: [
    'voltR',
    'voltG',
    'ampR',
    'ampG',
    'tempStat',
  ] as const,
  VGL: [] as const,
  BGL: [] as const,
  LGL: [] as const,
};
