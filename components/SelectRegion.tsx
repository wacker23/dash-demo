import { Box, Grid } from '@mui/material';
import Select from './Select';
import regions from '../lib/regions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from 'react-kakao-maps-sdk';
import { addressSearch } from '../lib/utils';

type ProvinceType = keyof typeof regions;

type Props = {
  province: string;
  district: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
};

const SelectRegion = ({province, district, ...props}: Props) => {

  const handleProvinceChange = (value: any) => {
    props.onProvinceChange(value);
  }

  const handleDistrictChange = (value: any) => {
    props.onDistrictChange(value);
  }

  return (
    <Grid container spacing={1}>
      <Grid item sx={{width: 150}}>
        <Select
          options={Object.keys(regions).map(province => ({
            label: province, value: province,
          }))}
          label={'시/도'}
          selectedValue={province}
          onChange={handleProvinceChange} />
      </Grid>
      <Grid item sx={{width: 150}}>
        {province && regions[province as ProvinceType].length > 0 && (
          <Select
            options={regions[province as ProvinceType].map(district => ({
              label: district, value: district,
            }))}
            label={'시/군/구'}
            selectedValue={district}
            onChange={handleDistrictChange} />
        )}
      </Grid>
    </Grid>
  );
};

type SelectRegionOnMapProps = {
  province?: string;
  district?: string;
}

export const SelectRegionOnMap = (props: SelectRegionOnMapProps) => {
  const map = useMap();
  const [province, setProvince] = useState(props.province ?? '');
  const [district, setDistrict] = useState(props.district ?? '');

  const moveToCenter = useCallback(async (addr: string) => {
    const newCenter = await addressSearch(addr);
    map.setCenter(newCenter);
    map.setLevel(3);
  }, [map]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 5,
        left: 5,
        zIndex: 10,
      }}>
      <SelectRegion
        province={props.province ?? province}
        district={props.district ?? district}
        onProvinceChange={value => {
          if (value !== province) {
            setProvince(value);
            setDistrict('');
            moveToCenter(value).then(() => false);
          }
        }}
        onDistrictChange={value => {
          if (value !== district) {
            setDistrict(value);
            moveToCenter(`${province} ${value}`).then(() => false);
          }
        }}/>
    </Box>
  );
};

export default SelectRegion;
