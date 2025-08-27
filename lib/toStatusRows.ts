import { EquipmentTypeKey } from '../types/constants';
import { EquipmentStatusDto } from '../types/equipment-status.dto';
import { EquipmentStatusFields } from './fields';
import { StatusRowsDto } from '../types/status-rows.dto';
import { AbnormalStatDescription } from './constants';

const toStatusRows = (type: EquipmentTypeKey, rows: EquipmentStatusDto[]): StatusRowsDto[] => {
  if (rows.length === 0) {
    return [];
  }

  return rows.map(({ id, rawData, state, abnormal, receive_date, ...props }) => {
    const fields = EquipmentStatusFields[type];
    const values = rawData.split('\n');

    return values.reduce<StatusRowsDto>((object, value, idx) => {
      const key = fields[idx];
      let newValue: string | number = value;

      switch (key) {
        case 'voltR':
        case 'voltG':
          newValue = Number(value) / 10;
          break;

        case 'tempStat':
          newValue = (Number(value) - 400) / 10;
          break;

        case 'powerLimit':
        case 'dirStat':
        case 'modeStat':
        case 'commStat':
        case 'pubNo':
        case 'firmwareResetCount':
        case 'dispErrId':
        case 'dutyR':
        case 'dutyG':
        case 'outStat':
          newValue = Number(value);
          break;

        case 'ampR':
        case 'ampG':
        case 'ampOff':
          // Keep as string if format is "설치값,현재값"
          if (value.includes(',')) {
            newValue = value;
          } else {
            newValue = Number(value);
          }
          break;

        case 'dispAbnormalStat':
          newValue = value.split(',').reduce((result, value, idx, array) => {
            if (!(idx % 2)) {
              const id = value;
              const state = AbnormalStatDescription[Number(array[idx + 1])];
              result += `${id} = ${state}\n`;
            }
            return result;
          }, '');
          break;

        case 'version':
          newValue = `${Number(value) / 100}`;
          break;

        case 'timestamp':
          const hour = value.slice(4, 6);
          const minute = value.slice(6, 8);
          newValue = `${hour}시 ${minute}분`;
          break;

        default:
          break;
      }

      // validate numeric conversions
      if (
        ['voltR', 'voltG', 'tempStat', 'powerLimit', 'dirStat', 'modeStat', 'commStat', 'pubNo', 'firmwareResetCount', 'dispErrId', 'dutyR', 'dutyG', 'outStat'].includes(key) ||
        (['ampR', 'ampG', 'ampOff'].includes(key) && !value.includes(','))
      ) {
        if (isNaN(Number(newValue))) {
          throw new Error(`Cannot convert value(${value}) to number for field(${key})`);
        }
      }

      return Object.assign(object, {
        [key]: newValue,
      });
    }, { id, state, abnormal, receive_date: new Date(receive_date) });
  });
};

export default toStatusRows;
